import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { getRotationForMachine } from "./rotation.service";

/**
 * Handle a machine QR scan by a signed-in student. Resolves the machine from
 * its opaque qrToken, figures out which room it should be in right now, and
 * records a WashSession ("machine in your hands") capturing how late the scan
 * was versus the rotation window and when it's due to move next.
 */
export class ScanService {
  async scan(user: User | null, qrToken: string) {
    requirePermission(user, "wash_sessions", "create");
    if (!user) throw AppError.unauthorized();

    const token = qrToken.trim();
    if (!token) throw AppError.badRequest("Missing QR token");

    const machine = await prisma.machine.findUnique({
      where: { qrToken: token },
    });
    if (!machine || machine.deletedAt) {
      throw AppError.notFound("Machine for this QR code");
    }

    // The scanning user must have a student profile.
    const student = await prisma.student.findFirst({
      where: { userId: user.id, deletedAt: null },
    });
    if (!student) {
      throw AppError.badRequest(
        "Finish your student profile (Settings) before scanning a machine."
      );
    }

    const now = new Date();
    const rotation = await getRotationForMachine(machine.id, now);
    const snap = rotation._snapshot;

    if (!snap.active || !snap.windowStartAt || !snap.windowEndAt) {
      throw AppError.badRequest(
        "This machine has no active rotation schedule right now."
      );
    }

    const roomId = snap.active.room.id;
    const windowStart = snap.windowStartAt;
    const windowEnd = snap.windowEndAt;

    // Idempotent within the current window: reuse an existing IN_USE session for
    // this student + machine started after the window opened.
    const existing = await prisma.washSession.findFirst({
      where: {
        machineId: machine.id,
        studentId: student.id,
        status: "IN_USE",
        scannedAt: { gte: windowStart },
      },
    });

    const session =
      existing ??
      (await prisma.washSession.create({
        data: {
          machineId: machine.id,
          roomId,
          studentId: student.id,
          scheduleId: snap.active.id,
          scannedAt: now,
          expectedStartAt: windowStart,
          dueBackAt: windowEnd,
          minutesLate: snap.minutesLate,
          status: "IN_USE",
        },
      }));

    return {
      session: {
        id: session.id,
        scannedAt: session.scannedAt.toISOString(),
        expectedStartAt: session.expectedStartAt.toISOString(),
        dueBackAt: session.dueBackAt.toISOString(),
        minutesLate: session.minutesLate,
        status: session.status,
      },
      machine: { id: machine.id, serialNumber: machine.serialNumber },
      room: rotation.room,
      hall: rotation.hall,
      minutesToNextRotation: rotation.minutesToNextRotation,
    };
  }

  /** The student's current active session (if any) — powers dashboard gating. */
  async getActiveSessionForUser(user: User | null) {
    if (!user) return null;
    const student = await prisma.student.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!student) return null;

    const session = await prisma.washSession.findFirst({
      where: { studentId: student.id, status: "IN_USE", dueBackAt: { gt: new Date() } },
      orderBy: { scannedAt: "desc" },
      include: { machine: true, room: { include: { hall: true } } },
    });
    if (!session) return null;

    return {
      id: session.id,
      scannedAt: session.scannedAt.toISOString(),
      expectedStartAt: session.expectedStartAt.toISOString(),
      dueBackAt: session.dueBackAt.toISOString(),
      minutesLate: session.minutesLate,
      status: session.status,
      machine: { id: session.machine.id, serialNumber: session.machine.serialNumber },
      room: session.room ? { id: session.room.id, number: session.room.number } : null,
      hall: session.room?.hall
        ? { code: session.room.hall.code, name: session.room.hall.name }
        : null,
    };
  }

  /** Mark a session as returned (machine handed off / done). */
  async endSession(user: User | null, sessionId: string) {
    if (!user) throw AppError.unauthorized();
    const student = await prisma.student.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw AppError.badRequest("No student profile");

    const session = await prisma.washSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== student.id) {
      throw AppError.notFound("Wash session", sessionId);
    }

    return prisma.washSession.update({
      where: { id: sessionId },
      data: { status: "RETURNED", endedAt: new Date() },
    });
  }
}

export const scanService = new ScanService();
