import { headers } from "next/headers";
import { auth, type User } from "@/lib/auth/config";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";

/**
 * Shared auth guards for API routes. Prefer these over ad-hoc session checks
 * so inactive accounts, staff vs student, and missing profiles stay consistent.
 */

export async function getSessionUser(): Promise<User | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return (session?.user as User | undefined) ?? null;
}

/** Require a signed-in, active user. */
export async function requireAuth(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw AppError.unauthorized();

  // Re-check isActive from DB (session cookie can be stale after deactivation)
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true, role: true },
  });
  if (!db || !db.isActive) {
    throw AppError.forbidden("This account has been deactivated.");
  }
  // Prefer DB role if session is stale
  return { ...user, role: db.role, isActive: true } as User;
}

/** Admin or super-admin only. */
export async function requireStaff(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw AppError.forbidden("Staff access only.");
  }
  return user;
}

/**
 * Student portal user with a linked Student row.
 * Returns both auth user and student id.
 */
export async function requireStudentAccount(): Promise<{
  user: User;
  studentId: string;
}> {
  const user = await requireAuth();
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    throw AppError.forbidden("Student account required.");
  }

  const { studentService } = await import("@/lib/services/student.service");
  await studentService.ensureStudentLinkedToUser(user);

  const student = await prisma.student.findFirst({
    where: { userId: user.id, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!student) {
    throw AppError.forbidden(
      "No student account is linked to this login. Contact WeWash admin."
    );
  }
  return { user, studentId: student.id };
}
