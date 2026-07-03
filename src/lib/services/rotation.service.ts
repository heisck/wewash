import { DayOfWeek, MachineSchedule, Room, Hall } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Rotation intelligence over MachineSchedule.
 *
 * Each room's window runs from its handoff time on its day until the next day's
 * handoff time (≈24h). NOTE: Ghana is GMT (UTC+0, no DST), so server UTC time
 * equals local time — no timezone conversion is needed.
 */

const DAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const INDEX_DAY: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

type ScheduleWithRoom = MachineSchedule & {
  room: Room & { hall: Hall | null };
};

export type RotationSnapshot = {
  active: ScheduleWithRoom | null;
  windowStartAt: Date | null;
  windowEndAt: Date | null;
  minutesToNextRotation: number;
  next: ScheduleWithRoom | null;
  minutesLate: number; // minutes `now` is past windowStartAt (0 if before/at start)
};

/** Parse "HH:MM" onto a given calendar date (UTC), returning a new Date. */
function atTime(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date(base);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d;
}

function dayOffset(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

/**
 * Pure computation: given the active schedules and a moment, work out which
 * room currently holds the machine, when it moves next, and how late a scan is.
 */
export function computeRotation(
  schedules: ScheduleWithRoom[],
  now: Date
): RotationSnapshot {
  const byDay = new Map<number, ScheduleWithRoom>();
  for (const s of schedules) {
    if (s.isActive !== false) byDay.set(DAY_INDEX[s.dayOfWeek], s);
  }

  const empty: RotationSnapshot = {
    active: null,
    windowStartAt: null,
    windowEndAt: null,
    minutesToNextRotation: 0,
    next: null,
    minutesLate: 0,
  };
  if (byDay.size === 0) return empty;

  // Active window: the most recent handoff <= now (search back up to 7 days).
  let active: ScheduleWithRoom | null = null;
  let windowStartAt: Date | null = null;
  for (let offset = 0; offset <= 7; offset++) {
    const day = dayOffset(now, -offset);
    const sched = byDay.get(day.getUTCDay());
    if (!sched) continue;
    const handoff = atTime(day, sched.startTime);
    if (handoff.getTime() <= now.getTime()) {
      active = sched;
      windowStartAt = handoff;
      break;
    }
  }

  // Next handoff: the earliest handoff strictly after now (search forward 7 days).
  let next: ScheduleWithRoom | null = null;
  let windowEndAt: Date | null = null;
  for (let offset = 0; offset <= 7; offset++) {
    const day = dayOffset(now, offset);
    const sched = byDay.get(day.getUTCDay());
    if (!sched) continue;
    const handoff = atTime(day, sched.startTime);
    if (handoff.getTime() > now.getTime()) {
      next = sched;
      windowEndAt = handoff;
      break;
    }
  }

  const minutesToNextRotation = windowEndAt
    ? Math.max(0, Math.round((windowEndAt.getTime() - now.getTime()) / 60000))
    : 0;
  const minutesLate = windowStartAt
    ? Math.max(0, Math.round((now.getTime() - windowStartAt.getTime()) / 60000))
    : 0;

  return { active, windowStartAt, windowEndAt, minutesToNextRotation, next, minutesLate };
}

/** Next calendar occurrence (>= now) of a given weekday + "HH:MM". */
export function nextOccurrence(dayOfWeek: DayOfWeek, hhmm: string, now: Date = new Date()): Date {
  for (let offset = 0; offset <= 7; offset++) {
    const day = dayOffset(now, offset);
    if (day.getUTCDay() === DAY_INDEX[dayOfWeek]) {
      const at = atTime(day, hhmm);
      if (at.getTime() >= now.getTime()) return at;
    }
  }
  // Fallback: same day next week
  return atTime(dayOffset(now, 7), hhmm);
}

/**
 * Rotation view for a specific student: when is *their* room's turn, and is the
 * machine physically in their room right now.
 */
export async function getStudentRotation(userId: string, now: Date = new Date()) {
  const student = await prisma.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, roomId: true },
  });
  if (!student?.roomId) return null;

  const mySchedule = (await prisma.machineSchedule.findFirst({
    where: { roomId: student.roomId, isActive: true },
    include: { room: { include: { hall: true } }, machine: true },
  })) as (ScheduleWithRoom & { machine: { id: string; serialNumber: string } }) | null;
  if (!mySchedule) return null;

  const rotation = await getRotationForMachine(mySchedule.machineId, now);
  const isHereNow = rotation.room?.id === student.roomId;
  const nextTurnAt = nextOccurrence(mySchedule.dayOfWeek, mySchedule.startTime, now);

  return {
    machine: { id: mySchedule.machine.id, serialNumber: mySchedule.machine.serialNumber },
    myRoom: { id: mySchedule.room.id, number: mySchedule.room.number },
    hall: mySchedule.room.hall
      ? { code: mySchedule.room.hall.code, name: mySchedule.room.hall.name }
      : null,
    myDay: mySchedule.dayOfWeek,
    myStartTime: mySchedule.startTime,
    isHereNow,
    nextTurnAt: nextTurnAt.toISOString(),
    currentRoom: rotation.room,
    windowEndAt: rotation.windowEndAt,
    minutesToNextRotation: rotation.minutesToNextRotation,
  };
}

/** Serializable rotation view for a machine at `now` (defaults to current time). */
export async function getRotationForMachine(machineId: string, now: Date = new Date()) {
  const schedules = (await prisma.machineSchedule.findMany({
    where: { machineId },
    include: { room: { include: { hall: true } } },
  })) as ScheduleWithRoom[];

  const snap = computeRotation(schedules, now);

  return {
    dayOfWeek: INDEX_DAY[now.getUTCDay()],
    room: snap.active ? { id: snap.active.room.id, number: snap.active.room.number } : null,
    hall: snap.active?.room.hall
      ? { code: snap.active.room.hall.code, name: snap.active.room.hall.name }
      : null,
    startTime: snap.active?.startTime ?? null,
    endTime: snap.active?.endTime ?? null,
    windowStartAt: snap.windowStartAt?.toISOString() ?? null,
    windowEndAt: snap.windowEndAt?.toISOString() ?? null,
    minutesToNextRotation: snap.minutesToNextRotation,
    minutesLate: snap.minutesLate,
    nextRoom: snap.next ? { id: snap.next.room.id, number: snap.next.room.number } : null,
    _snapshot: snap,
  };
}
