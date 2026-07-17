import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { getRotationForMachine } from "./rotation.service";

/**
 * Machine QR scan:
 * 1. QR encodes https://{APP_URL}/scan/{qrToken} → our website
 * 2. Signed-in student scans → WashSession: this person has this machine
 * 3. Location = the scanning student's room (machine is in their room now)
 * 4. Rotation schedule still supplies the handoff window / lateness when present
 */
export class ScanService {
  /** Public: resolve machine label from QR token (no auth) for the scan landing page. */
  async peekMachine(qrToken: string) {
    const token = qrToken.trim();
    if (!token) throw AppError.badRequest("Missing QR token");

    const machine = await prisma.machine.findFirst({
      where: { qrToken: token, deletedAt: null, isActive: true },
      select: {
        id: true,
        serialNumber: true,
        name: true,
        code: true,
        status: true,
        hall: { select: { code: true, name: true } },
      },
    });
    if (!machine) throw AppError.notFound("Machine for this QR code");

    return {
      id: machine.id,
      serialNumber: machine.serialNumber,
      name: machine.name,
      code: machine.code,
      label: machine.code || machine.name || machine.serialNumber,
      status: machine.status,
      hall: machine.hall,
    };
  }

  async scan(user: User | null, qrToken: string) {
    requirePermission(user, "wash_sessions", "create");
    if (!user) throw AppError.unauthorized();

    const token = qrToken.trim();
    if (!token) throw AppError.badRequest("Missing QR token");

    const machine = await prisma.machine.findFirst({
      where: { qrToken: token, deletedAt: null },
    });
    if (!machine) {
      throw AppError.notFound("Machine for this QR code");
    }
    if (!machine.isActive || machine.status === "INACTIVE" || machine.status === "FAULTY") {
      throw AppError.badRequest("This machine is not available for scanning.");
    }

    const student = await prisma.student.findFirst({
      where: { userId: user.id, deletedAt: null, isActive: true },
      include: {
        room: { include: { hall: true } },
      },
    });
    if (!student) {
      throw AppError.badRequest(
        "Your account is not linked to a student profile. Contact WeWash admin."
      );
    }

    return this.claimForStudent(student, machine);
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
      machine: {
        id: session.machine.id,
        serialNumber: session.machine.serialNumber,
        name: session.machine.name,
        code: session.machine.code,
        label: session.machine.code || session.machine.name || session.machine.serialNumber,
      },
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

  /**
   * Admin claims a machine for a student (manual scan).
   * Same result as the student scanning the machine QR themselves.
   */
  async adminScanForStudent(
    admin: User | null,
    input: { studentId: string; machineId: string }
  ) {
    requirePermission(admin, "wash_sessions", "create");
    if (!admin) throw AppError.unauthorized();
    if (admin.role === "STUDENT") {
      throw AppError.forbidden("Only staff can perform a manual scan for a student.");
    }

    const machine = await prisma.machine.findFirst({
      where: { id: input.machineId, deletedAt: null },
    });
    if (!machine) throw AppError.notFound("Machine", input.machineId);
    if (!machine.isActive || machine.status === "INACTIVE" || machine.status === "FAULTY") {
      throw AppError.badRequest("This machine is not available for scanning.");
    }

    const student = await prisma.student.findFirst({
      where: { id: input.studentId, deletedAt: null, isActive: true },
      include: { room: { include: { hall: true } } },
    });
    if (!student) throw AppError.notFound("Student", input.studentId);

    return this.claimForStudent(student, machine);
  }

  /** Shared claim logic (student self-scan or admin manual). */
  private async claimForStudent(
    student: {
      id: string;
      firstName: string;
      lastName: string;
      roomId: string | null;
      roomNumber: string | null;
      groupId: string | null;
      room: {
        id: string;
        number: string;
        hallId: string;
        hall: { code: string; name: string } | null;
      } | null;
    },
    machine: {
      id: string;
      serialNumber: string;
      name: string | null;
      code: string | null;
      hallId: string | null;
      isActive: boolean;
      status: string;
    }
  ) {
    let room = student.room;
    if (!room && student.roomNumber) {
      if (student.groupId) {
        const group = await prisma.studentGroup.findFirst({
          where: { id: student.groupId, deletedAt: null },
        });
        if (group) {
          room = await prisma.room.findFirst({
            where: {
              hallId: group.hallId,
              number: student.roomNumber,
              deletedAt: null,
            },
            include: { hall: true },
          });
        }
      }
    }
    if (!room) {
      throw AppError.badRequest(
        "Student needs an assigned room before the machine can be claimed for them."
      );
    }

    const now = new Date();
    const rotation = await getRotationForMachine(machine.id, now).catch(() => null);
    const snap = rotation?._snapshot;

    let windowStart = now;
    let windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let minutesLate: number | null = null;
    let scheduleId: string | null = null;

    if (snap?.active && snap.windowStartAt && snap.windowEndAt) {
      windowStart = snap.windowStartAt;
      windowEnd = snap.windowEndAt;
      minutesLate = snap.minutesLate ?? null;
      scheduleId = snap.active.id;
    }

    const existing = await prisma.washSession.findFirst({
      where: {
        machineId: machine.id,
        studentId: student.id,
        status: "IN_USE",
      },
    });

    await prisma.washSession.updateMany({
      where: {
        machineId: machine.id,
        status: "IN_USE",
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      data: { status: "RETURNED", endedAt: now },
    });

    const session = existing
      ? await prisma.washSession.update({
          where: { id: existing.id },
          data: {
            roomId: room.id,
            scannedAt: now,
            expectedStartAt: windowStart,
            dueBackAt: windowEnd,
            minutesLate,
            scheduleId,
          },
        })
      : await prisma.washSession.create({
          data: {
            machineId: machine.id,
            roomId: room.id,
            studentId: student.id,
            scheduleId,
            scannedAt: now,
            expectedStartAt: windowStart,
            dueBackAt: windowEnd,
            minutesLate,
            status: "IN_USE",
          },
        });

    if (room.hallId && machine.hallId !== room.hallId) {
      await prisma.machine.update({
        where: { id: machine.id },
        data: { hallId: room.hallId },
      });
    }

    const machineLabel = machine.code || machine.name || machine.serialNumber;
    const minutesToNext =
      rotation?.minutesToNextRotation ??
      Math.max(0, Math.round((windowEnd.getTime() - now.getTime()) / 60_000));

    return {
      session: {
        id: session.id,
        scannedAt: session.scannedAt.toISOString(),
        expectedStartAt: session.expectedStartAt.toISOString(),
        dueBackAt: session.dueBackAt.toISOString(),
        minutesLate: session.minutesLate,
        status: session.status,
      },
      machine: {
        id: machine.id,
        serialNumber: machine.serialNumber,
        name: machine.name,
        code: machine.code,
        label: machineLabel,
      },
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      room: { id: room.id, number: room.number },
      hall: room.hall ? { code: room.hall.code, name: room.hall.name } : null,
      minutesToNextRotation: minutesToNext,
      message: `${machineLabel} is now with ${student.firstName} in Room ${room.number}.`,
    };
  }
}

export const scanService = new ScanService();
