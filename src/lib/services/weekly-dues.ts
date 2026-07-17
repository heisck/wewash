import { prisma } from "@/lib/db/prisma";
import { startOfBillingWeek, endOfBillingWeek } from "@/lib/utils/week";

/**
 * Weekly dues (not monthly / bi-weekly).
 * Admin assigns `Student.weeklyAmount` at creation.
 * Each Mon–Sun week, COMPLETED payments are summed (pieces allowed).
 * Paid in full when sum >= weeklyAmount (overpay still counts as full).
 * Only COMPLETED (admin-confirmed) amounts count — PENDING proofs do not.
 */

export type WeekDuesStatus = {
  studentId: string;
  weeklyAmount: number;
  paidThisWeek: number;
  remaining: number;
  isPaidInFull: boolean;
  weekStart: string;
  weekEnd: string;
};

export function money(n: unknown): number {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v : 0;
}

/** True when confirmed paid meets or exceeds the assigned weekly fee. */
export function isPaidInFull(paidThisWeek: number, weeklyAmount: number): boolean {
  if (weeklyAmount <= 0) return true;
  return paidThisWeek + 1e-6 >= weeklyAmount;
}

export function remainingDues(paidThisWeek: number, weeklyAmount: number): number {
  if (weeklyAmount <= 0) return 0;
  return Math.max(0, Math.round((weeklyAmount - paidThisWeek) * 100) / 100);
}

/**
 * Sum COMPLETED payment amounts per student for the current billing week.
 * Uses amountPaid when set, else amount.
 */
export async function sumCompletedPaidThisWeek(
  studentIds?: string[],
  now: Date = new Date()
): Promise<Map<string, number>> {
  const weekStart = startOfBillingWeek(now);
  const where = {
    status: "COMPLETED" as const,
    deletedAt: null,
    ...(studentIds?.length ? { studentId: { in: studentIds } } : {}),
    OR: [
      { paidAt: { gte: weekStart } },
      // Confirmed without paidAt stamp — count by confirmation time
      { paidAt: null, updatedAt: { gte: weekStart } },
    ],
  };

  const rows = await prisma.payment.findMany({
    where,
    select: { studentId: true, amountPaid: true, amount: true },
  });

  const map = new Map<string, number>();
  for (const r of rows) {
    const amt = money(r.amountPaid ?? r.amount);
    map.set(r.studentId, (map.get(r.studentId) ?? 0) + amt);
  }
  return map;
}

/** Status for one student this week. */
export async function getStudentWeekDues(
  studentId: string,
  weeklyAmount: number,
  now: Date = new Date()
): Promise<WeekDuesStatus> {
  const paidMap = await sumCompletedPaidThisWeek([studentId], now);
  const paidThisWeek = paidMap.get(studentId) ?? 0;
  const due = money(weeklyAmount);
  return {
    studentId,
    weeklyAmount: due,
    paidThisWeek,
    remaining: remainingDues(paidThisWeek, due),
    isPaidInFull: isPaidInFull(paidThisWeek, due),
    weekStart: startOfBillingWeek(now).toISOString(),
    weekEnd: endOfBillingWeek(now).toISOString(),
  };
}

/** Set of student IDs who have paid in full for this week (or have no fee). */
export async function studentIdsPaidInFullThisWeek(
  students: { id: string; weeklyAmount: unknown }[],
  now: Date = new Date()
): Promise<Set<string>> {
  if (!students.length) return new Set();
  const paidMap = await sumCompletedPaidThisWeek(
    students.map((s) => s.id),
    now
  );
  const full = new Set<string>();
  for (const s of students) {
    const due = money(s.weeklyAmount);
    const paid = paidMap.get(s.id) ?? 0;
    if (isPaidInFull(paid, due)) full.add(s.id);
  }
  return full;
}
