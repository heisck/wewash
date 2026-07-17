import { randomBytes } from "node:crypto";
import { Prisma, Machine, MachineSchedule, DayOfWeek } from "@prisma/client";
import { MachineRepository } from "@/lib/repositories/machine.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import {
  CreateMachineInput,
  UpdateMachineInput,
  MachineFilterInput,
  BulkMachineScheduleInput,
} from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";
import { prisma } from "@/lib/db/prisma";
import { notificationService } from "@/lib/services/notification.service";
import { logger } from "@/lib/logger";

const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function scheduleKey(roomId: string, dayOfWeek: string, startTime: string) {
  return `${roomId}|${dayOfWeek}|${startTime}`;
}

export class MachineService {
  private readonly repo: MachineRepository;

  constructor() {
    this.repo = new MachineRepository();
  }

  /**
   * Get paginated machines.
   */
  async getMachines(
    user: User | null,
    filters: MachineFilterInput,
    pagination: PaginationInput
  ): Promise<{ data: Machine[]; total: number }> {
    requirePermission(user, "machines", "read");

    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.MachineWhereInput = {};

    if (filters.search) {
      where.OR = [
        { serialNumber: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
        { brand: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.hallId) where.hallId = filters.hallId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await this.repo.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        hall: true,
        machineSchedules: {
          where: { isActive: true },
          include: { room: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Live location from student QR scan (WashSession), not only the schedule.
    const { prisma } = await import("@/lib/db/prisma");
    const machineIds = data.map((m) => m.id);
    const activeSessions =
      machineIds.length === 0
        ? []
        : await prisma.washSession.findMany({
            where: {
              machineId: { in: machineIds },
              status: "IN_USE",
            },
            orderBy: { scannedAt: "desc" },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentId: true,
                },
              },
              room: { select: { id: true, number: true } },
            },
          });

    const heldByMap = new Map<
      string,
      {
        studentId: string;
        firstName: string;
        lastName: string;
        universityId: string;
        roomId: string;
        roomNumber: string;
        scannedAt: string;
        dueBackAt: string;
      }
    >();
    for (const s of activeSessions) {
      if (heldByMap.has(s.machineId)) continue; // newest first
      if (!s.student || !s.room) continue;
      heldByMap.set(s.machineId, {
        studentId: s.student.id,
        firstName: s.student.firstName,
        lastName: s.student.lastName,
        universityId: s.student.studentId,
        roomId: s.room.id,
        roomNumber: s.room.number,
        scannedAt: s.scannedAt.toISOString(),
        dueBackAt: s.dueBackAt.toISOString(),
      });
    }

    const enriched = data.map((m) => {
      const heldBy = heldByMap.get(m.id) ?? null;
      const row = m as Machine & {
        machineSchedules?: MachineSchedule[];
        schedules?: MachineSchedule[];
        heldBy?: typeof heldBy;
        currentRoom?: { id: string; number: string } | null;
      };
      // Client already looks at schedules; also expose as schedules alias.
      row.schedules = row.machineSchedules ?? row.schedules;
      row.heldBy = heldBy;
      if (heldBy) {
        row.currentRoom = { id: heldBy.roomId, number: heldBy.roomNumber };
      }
      return row;
    });

    return { data: enriched as Machine[], total };
  }

  /**
   * Get a machine by ID with its full rotation schedule.
   */
  async getMachineDetails(
    user: User | null,
    id: string
  ): Promise<Machine & { schedules: MachineSchedule[] }> {
    requirePermission(user, "machines", "read");

    const machine = await this.repo.findById(id);
    if (!machine) throw AppError.notFound("Machine", id);

    const schedules = await this.repo.getSchedule(id);

    return { ...machine, schedules };
  }

  /**
   * Create a new machine.
   */
  async createMachine(user: User | null, data: CreateMachineInput): Promise<Machine> {
    requirePermission(user, "machines", "create");

    const existing = await this.repo.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw AppError.conflict(`Machine with serial ${data.serialNumber} exists`);
    }

    // Each machine gets an opaque QR token embedded in its printed QR code.
    const qrToken = randomBytes(16).toString("hex");
    const {
      hallId,
      purchaseDate,
      installationDate,
      warrantyExpiry,
      serialNumber,
      name,
      code,
      brand,
      model,
      capacityKg,
      machineType,
      notes,
    } = data;

    return this.repo.create({
      serialNumber,
      name,
      code,
      brand,
      model,
      capacityKg,
      machineType,
      notes,
      qrToken,
      purchaseDate: purchaseDate ?? undefined,
      installationDate: installationDate ?? undefined,
      warrantyExpiry: warrantyExpiry ?? undefined,
      hall: hallId ? { connect: { id: hallId } } : undefined,
    });
  }

  /**
   * Ensure a machine has a qrToken (backfill for machines created before QR
   * tokens existed), returning the token.
   */
  async ensureQrToken(user: User | null, id: string): Promise<string> {
    requirePermission(user, "machines", "read");
    const machine = await this.repo.findById(id);
    if (!machine) throw AppError.notFound("Machine", id);
    if (machine.qrToken) return machine.qrToken;
    const qrToken = randomBytes(16).toString("hex");
    await this.repo.update(id, { qrToken });
    return qrToken;
  }

  /**
   * Update machine details.
   */
  async updateMachine(user: User | null, id: string, data: UpdateMachineInput): Promise<Machine> {
    requirePermission(user, "machines", "update");

    const machine = await this.repo.findById(id);
    if (!machine) throw AppError.notFound("Machine", id);

    if (data.serialNumber && data.serialNumber !== machine.serialNumber) {
      const existing = await this.repo.findBySerialNumber(data.serialNumber);
      if (existing) throw AppError.conflict("Serial number already in use");
    }

    const { hallId, purchaseDate, installationDate, warrantyExpiry, ...rest } = data;
    const updateData: Prisma.MachineUpdateInput = { ...rest };
    if (hallId !== undefined) {
      updateData.hall = hallId ? { connect: { id: hallId } } : { disconnect: true };
    }
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate;
    if (installationDate !== undefined) updateData.installationDate = installationDate;
    if (warrantyExpiry !== undefined) updateData.warrantyExpiry = warrantyExpiry;

    return this.repo.update(id, updateData);
  }

  /**
   * Replace the full 7-day rotation schedule for a machine.
   * Students in rooms that are newly assigned (or whose day/time changed)
   * get an SMS + push so they know their wash slot.
   */
  async replaceSchedule(user: User | null, data: BulkMachineScheduleInput): Promise<void> {
    requirePermission(user, "schedules", "update");

    const machine = await this.repo.findById(data.machineId);
    if (!machine) throw AppError.notFound("Machine", data.machineId);

    // Ensure no duplicate days in payload
    const days = data.schedules.map((s) => s.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw AppError.badRequest("Schedule contains duplicate days of the week");
    }

    const previous = await this.repo.getSchedule(data.machineId);
    const prevKeys = new Set(
      previous.map((s) => scheduleKey(s.roomId, s.dayOfWeek, s.startTime))
    );

    const scheduleData = data.schedules.map((s) => ({
      machineId: data.machineId,
      roomId: s.roomId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      orderIndex: s.orderIndex,
    }));

    await this.repo.replaceSchedule(data.machineId, scheduleData);

    const newOrChanged = data.schedules.filter(
      (s) => !prevKeys.has(scheduleKey(s.roomId, s.dayOfWeek, s.startTime))
    );
    if (newOrChanged.length > 0) {
      await this.notifyRoomsAssigned(machine, newOrChanged);
    }
  }

  /**
   * SMS/push students when their room is put on (or re-timed on) a machine rotation.
   * Best-effort: failures are logged, never throw back to the admin save.
   */
  private async notifyRoomsAssigned(
    machine: Machine,
    slots: Array<{ roomId: string; dayOfWeek: DayOfWeek; startTime: string }>
  ): Promise<void> {
    try {
      // Group slots by room so each student gets one message listing all new days.
      const byRoom = new Map<string, Array<{ dayOfWeek: DayOfWeek; startTime: string }>>();
      for (const s of slots) {
        const list = byRoom.get(s.roomId) ?? [];
        list.push({ dayOfWeek: s.dayOfWeek, startTime: s.startTime });
        byRoom.set(s.roomId, list);
      }

      const roomIds = [...byRoom.keys()];
      const rooms = await prisma.room.findMany({
        where: { id: { in: roomIds }, deletedAt: null },
        select: {
          id: true,
          number: true,
          hall: { select: { code: true, name: true } },
          students: {
            where: { deletedAt: null, isActive: true },
            select: {
              firstName: true,
              phone: true,
              userId: true,
              user: { select: { notifySms: true } },
            },
          },
        },
      });

      const serial = machine.serialNumber || machine.code || machine.name || "machine";

      for (const room of rooms) {
        const roomSlots = byRoom.get(room.id) ?? [];
        if (!roomSlots.length || !room.students.length) continue;

        const dayList = roomSlots
          .map((s) => `${DAY_LABEL[s.dayOfWeek] ?? s.dayOfWeek} ${s.startTime}`)
          .join(", ");
        const place = room.hall
          ? `Room ${room.number}, ${room.hall.code}`
          : `Room ${room.number}`;

        for (const st of room.students) {
          const allowSms = st.user?.notifySms !== false;
          const userIds = st.userId ? [st.userId] : [];
          const title = "You're on the wash rotation";
          const body = `Hi ${st.firstName}, ${place} is scheduled: ${dayList}. Machine ${serial}. Open WeWash for details. - WeWash`;

          const channels: Array<"SMS" | "PUSH"> = [];
          if (allowSms && st.phone) channels.push("SMS");
          if (userIds.length) channels.push("PUSH");
          if (!channels.length) continue;

          await notificationService.notify({
            phones: allowSms && st.phone ? [st.phone] : undefined,
            userIds,
            title,
            body,
            url: "/student",
            channels,
          });
        }
      }
    } catch (err) {
      logger.warn({ err, machineId: machine.id }, "Rotation assignment notify failed");
    }
  }
}

export const machineService = new MachineService();
