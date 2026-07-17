/**
 * Billing week helpers (Mon 00:00 → Sun 23:59, Ghana = UTC).
 * Students have the full calendar week to pay weekly dues.
 */

import type { DayOfWeek } from "@prisma/client";

const DAY_TO_UTC: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** Monday-based index: Mon=0 … Sun=6 */
export function mondayIndexFromUtcDay(utcDay: number): number {
  return utcDay === 0 ? 6 : utcDay - 1;
}

export function mondayIndexFromDayOfWeek(day: DayOfWeek): number {
  return mondayIndexFromUtcDay(DAY_TO_UTC[day]);
}

/** Start of current billing week (Monday 00:00 UTC). */
export function startOfBillingWeek(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monIdx = mondayIndexFromUtcDay(d.getUTCDay());
  d.setUTCDate(d.getUTCDate() - monIdx);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** End of current billing week (Sunday 23:59:59.999 UTC). */
export function endOfBillingWeek(now: Date = new Date()): Date {
  const start = startOfBillingWeek(now);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/** True when today is Friday (2 calendar days before Sunday week-end). */
export function isTwoDaysBeforeWeekEnd(now: Date = new Date()): boolean {
  return now.getUTCDay() === 5; // Friday
}

/**
 * True if this room's rotation day for the week has already started/passed
 * (so the student can be nudged to pay after using the machine).
 */
export function rotationDayPassed(
  scheduleDays: DayOfWeek[],
  now: Date = new Date()
): boolean {
  if (!scheduleDays.length) {
    // No schedule — still allow pay nudges mid-week (after Monday)
    return mondayIndexFromUtcDay(now.getUTCDay()) >= 1;
  }
  const todayMon = mondayIndexFromUtcDay(now.getUTCDay());
  const earliest = Math.min(...scheduleDays.map(mondayIndexFromDayOfWeek));
  return todayMon > earliest;
}
