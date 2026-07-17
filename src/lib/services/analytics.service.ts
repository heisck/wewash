import { prisma } from "@/lib/db/prisma";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";

const DAY_ORDER = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function parseHHMM(time: string, base: Date) {
  const [h, m] = time.split(":").map(Number);
  const out = new Date(base);
  out.setHours(h || 0, m || 0, 0, 0);
  return out;
}

/**
 * Compute the next rotation window end for a machine from its schedule,
 * relative to "now". Returns hours remaining + labels for current/next room.
 */
function computeRotation(schedules: Array<{
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
  room: { id: string; number: string; block?: string | null; floor?: number | null; section?: string | null } | null;
}>, now = new Date()) {
  if (!schedules.length) {
    return {
      currentRoom: null as null | { id: string; number: string },
      nextRoom: null as null | { id: string; number: string },
      hoursToNextTransfer: null as number | null,
      windowEndAt: null as string | null,
    };
  }

  const sorted = [...schedules].sort((a, b) => a.orderIndex - b.orderIndex);
  const todayIdx = now.getDay(); // 0=Sun
  const todayName = DAY_ORDER[todayIdx];

  // Prefer today's schedule entry if any.
  let current = sorted.find((s) => s.dayOfWeek === todayName) ?? null;
  if (!current) {
    // Fall back to nearest upcoming by day-of-week order.
    for (let i = 0; i < 7; i++) {
      const name = DAY_ORDER[(todayIdx + i) % 7];
      const hit = sorted.find((s) => s.dayOfWeek === name);
      if (hit) {
        current = hit;
        break;
      }
    }
  }
  if (!current) {
    return { currentRoom: null, nextRoom: null, hoursToNextTransfer: null, windowEndAt: null };
  }

  const currentIdx = Math.max(
    0,
    sorted.findIndex(
      (s) => s.dayOfWeek === current!.dayOfWeek && s.orderIndex === current!.orderIndex
    )
  );
  const next = sorted[(currentIdx + 1) % sorted.length];

  // Window end: endTime today (or next occurrence of current day) — treat as 24h handoff.
  const currentDayOffset = (DAY_ORDER.indexOf(current.dayOfWeek as typeof DAY_ORDER[number]) - todayIdx + 7) % 7;
  const windowBase = new Date(now);
  windowBase.setDate(windowBase.getDate() + currentDayOffset);
  let windowEnd = parseHHMM(current.endTime || current.startTime || "08:00", windowBase);
  // If end is same clock time as start (typical 24h slot), end is next day.
  if (current.endTime === current.startTime || windowEnd <= parseHHMM(current.startTime || "08:00", windowBase)) {
    windowEnd = new Date(windowEnd.getTime() + 24 * 60 * 60 * 1000);
  }
  if (windowEnd <= now && currentDayOffset === 0) {
    windowEnd = new Date(windowEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  const ms = windowEnd.getTime() - now.getTime();
  const hoursToNextTransfer = Math.max(0, Math.round((ms / (1000 * 60 * 60)) * 10) / 10);

  return {
    currentRoom: current.room ? { id: current.room.id, number: current.room.number } : null,
    nextRoom: next?.room ? { id: next.room.id, number: next.room.number } : null,
    hoursToNextTransfer,
    windowEndAt: windowEnd.toISOString(),
  };
}

export class AnalyticsService {
  async getDashboardStats(user: User | null) {
    requirePermission(user, "system_config", "read");

    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const [
      registeredStudents,
      activeStudents,
      totalMachines,
      activeMachines,
      faultyMachines,
      maintenanceMachines,
      registeredRooms,
      activeContracts,
      completedAll,
      completedWeek,
      completedMonth,
      pendingPayments,
      openFaults,
      machinesWithSchedule,
      recentFaultRows,
    ] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null, isActive: true } }),
      prisma.machine.count({ where: { deletedAt: null } }),
      prisma.machine.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.machine.count({ where: { deletedAt: null, status: "FAULTY" } }),
      prisma.machine.count({ where: { deletedAt: null, status: "MAINTENANCE" } }),
      prisma.room.count({ where: { deletedAt: null } }),
      prisma.contract.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", deletedAt: null, paidAt: { gte: weekStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", deletedAt: null, paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { deletedAt: null, status: { in: ["PENDING"] } },
        select: { amount: true, amountDue: true, amountPaid: true },
      }),
      prisma.faultReport.count({
        where: {
          deletedAt: null,
          status: { in: ["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS"] },
        },
      }),
      prisma.machine.findMany({
        where: { deletedAt: null },
        include: {
          hall: true,
          machineSchedules: {
            where: { isActive: true },
            include: { room: true },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.faultReport.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          machine: { select: { serialNumber: true, name: true, code: true } },
          reportedBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const amountCollected = completedAll._sum.amount?.toNumber() || 0;
    const weeklyIncome = completedWeek._sum.amount?.toNumber() || 0;
    const monthlyIncome = completedMonth._sum.amount?.toNumber() || 0;

    // Outstanding = sum of (amountDue - amountPaid) for pending, or amount if no split.
    let outstandingBalance = 0;
    for (const p of pendingPayments) {
      const due = p.amountDue?.toNumber() ?? p.amount.toNumber();
      const paid = p.amountPaid?.toNumber() ?? 0;
      outstandingBalance += Math.max(0, due - paid);
    }

    // Also estimate dues from active students with weeklyAmount and no completed payment this week.
    const activeWithFees = await prisma.student.findMany({
      where: { deletedAt: null, isActive: true, weeklyAmount: { gt: 0 } },
      select: {
        id: true,
        weeklyAmount: true,
        payments: {
          where: {
            status: "COMPLETED",
            deletedAt: null,
            paidAt: { gte: weekStart },
          },
          select: { amount: true },
        },
      },
    });
    for (const s of activeWithFees) {
      const paidThisWeek = s.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
      const due = s.weeklyAmount.toNumber();
      if (paidThisWeek < due) outstandingBalance += due - paidThisWeek;
    }

    const machineLocations = machinesWithSchedule.map((m) => {
      const rot = computeRotation(
        m.machineSchedules.map((s) => ({
          ...s,
          room: s.room,
        })),
        now
      );
      const label = m.code || m.name || m.serialNumber;
      return {
        machineId: m.id,
        machineLabel: label,
        status: m.status,
        hallCode: m.hall?.code ?? null,
        currentRoom: rot.currentRoom?.number ?? null,
        previousRoom: null as string | null,
        nextRoom: rot.nextRoom?.number ?? null,
        hoursToNextTransfer: rot.hoursToNextTransfer,
      };
    });

    // Fill previous room from schedule order.
    for (const m of machinesWithSchedule) {
      const sorted = [...m.machineSchedules].sort((a, b) => a.orderIndex - b.orderIndex);
      if (sorted.length < 2) continue;
      const loc = machineLocations.find((l) => l.machineId === m.id);
      if (!loc?.currentRoom) continue;
      const idx = sorted.findIndex((s) => s.room?.number === loc.currentRoom);
      if (idx >= 0) {
        const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
        loc.previousRoom = prev.room?.number ?? null;
      }
    }

    const upcomingTransfers = machineLocations
      .filter((m) => m.hoursToNextTransfer != null)
      .map((m) => {
        const full = machinesWithSchedule.find((x) => x.id === m.machineId);
        const rot = full
          ? computeRotation(
              full.machineSchedules.map((s) => ({ ...s, room: s.room })),
              now
            )
          : null;
        return {
          machineId: m.machineId,
          machineLabel: m.machineLabel,
          currentRoom: m.currentRoom,
          nextRoom: m.nextRoom,
          hallCode: m.hallCode,
          hoursRemaining: m.hoursToNextTransfer ?? 0,
          windowEndAt: rot?.windowEndAt ?? now.toISOString(),
        };
      })
      .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

    const recentFaults = recentFaultRows.map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      studentName: f.reportedBy
        ? `${f.reportedBy.firstName} ${f.reportedBy.lastName}`
        : undefined,
      machineLabel:
        f.machine?.code || f.machine?.name || f.machine?.serialNumber || undefined,
    }));

    return {
      totalIncome: amountCollected,
      weeklyIncome,
      monthlyIncome,
      amountCollected,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      activeStudents,
      registeredStudents,
      registeredRooms,
      machines: {
        total: totalMachines,
        active: activeMachines,
        faulty: faultyMachines,
        maintenance: maintenanceMachines,
      },
      activeContracts,
      openFaults,
      revenue: amountCollected,
      upcomingTransfers,
      machineLocations,
      recentFaults,
    };
  }
}

export const analyticsService = new AnalyticsService();
