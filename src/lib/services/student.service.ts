import { Prisma, Student } from "@prisma/client";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { CreateStudentInput, UpdateStudentInput, StudentFilterInput } from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";
import { notificationService } from "./notification.service";
import {
  money,
  isPaidInFull,
  remainingDues,
  sumCompletedPaidThisWeek,
} from "./weekly-dues";

export class StudentService {
  private readonly repo: StudentRepository;

  constructor() {
    this.repo = new StudentRepository();
  }

  /**
   * Get a paginated list of students.
   */
  async getStudents(
    user: User | null,
    filters: StudentFilterInput,
    pagination: PaginationInput
  ): Promise<{ data: Student[]; total: number }> {
    requirePermission(user, "students", "read");

    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.StudentWhereInput = {};

    const and: Prisma.StudentWhereInput[] = [];
    if (filters.search) {
      and.push({
        OR: [
          { studentId: { contains: filters.search, mode: "insensitive" } },
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { roomNumber: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.groupId) where.groupId = filters.groupId;
    if (filters.hallId) {
      and.push({
        OR: [
          { group: { hallId: filters.hallId } },
          { room: { hallId: filters.hallId } },
        ],
      });
    }
    if (and.length) where.AND = and;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await this.repo.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          include: {
            hall: true,
            machineSchedules: {
              where: { isActive: true },
              select: {
                dayOfWeek: true,
                startTime: true,
                machine: { select: { serialNumber: true, code: true } },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        group: { include: { hall: true } },
      },
    });

    // Attach this week's confirmed dues so the admin roster can show paid/remaining.
    const paidMap = await sumCompletedPaidThisWeek(data.map((s) => s.id));
    const enriched = data.map((s) => {
      const weeklyAmount = money(s.weeklyAmount);
      const paidThisWeek = paidMap.get(s.id) ?? 0;
      const schedules =
        (
          s as {
            room?: {
              machineSchedules?: Array<{
                dayOfWeek: string;
                startTime: string;
                machine?: { serialNumber?: string | null; code?: string | null } | null;
              }>;
            } | null;
          }
        ).room?.machineSchedules ?? [];
      return {
        ...s,
        weeklyAmount,
        paidThisWeek,
        remaining: remainingDues(paidThisWeek, weeklyAmount),
        isPaidInFull: isPaidInFull(paidThisWeek, weeklyAmount),
        scheduleDays: schedules.map((ms) => ms.dayOfWeek),
        scheduleSlots: schedules.map((ms) => ({
          dayOfWeek: ms.dayOfWeek,
          startTime: ms.startTime,
          machineLabel: ms.machine?.serialNumber || ms.machine?.code || null,
        })),
      };
    });

    return { data: enriched as unknown as Student[], total };
  }

  /**
   * Get the current user's own student profile (with room + hall).
   * Returns null if the signed-in user has no student record yet.
   * Auto-links a student row that matches the login email and has no userId yet
   * (common when admin registered the student before they first signed in).
   */
  async getMyProfile(user: User | null) {
    if (!user) throw AppError.unauthorized("Not signed in");
    await this.ensureStudentLinkedToUser(user);
    return this.repo.findByUserIdDetailed(user.id);
  }

  /**
   * If this login has no Student.userId yet, attach the student record that
   * uses the same email (case-insensitive), when it is free to claim.
   * Never links or demotes ADMIN / SUPER_ADMIN accounts.
   */
  async ensureStudentLinkedToUser(user: User | null): Promise<string | null> {
    if (!user?.id) return null;
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return null;

    const existing = await this.repo.findByUserId(user.id);
    if (existing) return existing.id;

    const email = (user.email || "").trim();
    if (!email) return null;

    const { prisma } = await import("@/lib/db/prisma");
    const orphan = await prisma.student.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        email: { equals: email, mode: "insensitive" },
        OR: [{ userId: null }, { userId: user.id }],
      },
      orderBy: { createdAt: "desc" },
    });
    if (!orphan) return null;
    if (orphan.userId && orphan.userId !== user.id) return null;

    await prisma.student.update({
      where: { id: orphan.id },
      data: { userId: user.id },
    });
    // Keep role STUDENT for portal access
    if (user.role !== "STUDENT") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "STUDENT" },
      });
    }
    return orphan.id;
  }

  /**
   * Student self-update: name/phone + notification prefs on User; first/last on Student.
   */
  async updateMySettings(
    user: User | null,
    data: {
      /** Full display name (admins / any role). */
      name?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      notifySms?: boolean;
      notifyEmail?: boolean;
    }
  ) {
    if (!user) throw AppError.unauthorized("Not signed in");
    const { prisma } = await import("@/lib/db/prisma");

    const student = await this.repo.findByUserId(user.id);

    const userUpdate: {
      name?: string;
      phone?: string;
      phoneNumber?: string;
      notifySms?: boolean;
      notifyEmail?: boolean;
    } = {};

    if (data.notifySms !== undefined) userUpdate.notifySms = data.notifySms;
    if (data.notifyEmail !== undefined) userUpdate.notifyEmail = data.notifyEmail;
    if (data.phone !== undefined) {
      userUpdate.phone = data.phone;
      userUpdate.phoneNumber = data.phone;
    }

    // Explicit full name (admin settings) takes priority.
    if (data.name !== undefined) {
      const cleaned = data.name.trim();
      if (!cleaned) throw AppError.badRequest("Display name cannot be empty.");
      userUpdate.name = cleaned;
    }

    let firstName = data.firstName;
    let lastName = data.lastName;
    if (student && (firstName !== undefined || lastName !== undefined)) {
      firstName = firstName ?? student.firstName;
      lastName = lastName ?? student.lastName;
      // Only overwrite name from first/last if display name wasn't sent.
      if (data.name === undefined) {
        userUpdate.name = `${firstName} ${lastName}`.trim();
      }
      await this.repo.update(student.id, {
        firstName,
        lastName,
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      });
    } else if (
      data.name === undefined &&
      (firstName !== undefined || lastName !== undefined)
    ) {
      const parts = (user.name || "").split(/\s+/);
      const f = firstName ?? parts[0] ?? "";
      const l = lastName ?? parts.slice(1).join(" ") ?? "";
      userUpdate.name = `${f} ${l}`.trim();
    }

    if (Object.keys(userUpdate).length) {
      await prisma.user.update({ where: { id: user.id }, data: userUpdate });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        notifySms: true,
        notifyEmail: true,
      },
    });
    const updatedStudent = await this.repo.findByUserIdDetailed(user.id);
    return { user: updatedUser, student: updatedStudent };
  }

  /**
   * Self-onboarding is disabled. Student accounts are created only by admins.
   */
  async onboardSelf(
    _user: User | null,
    _data: { studentId: string; phone: string; hallId?: string; roomNumber?: string }
  ): Promise<Student> {
    throw AppError.forbidden(
      "Student accounts are created by the administrator. Please sign in with the email assigned to you."
    );
  }

  /**
   * Get a single student by ID.
   */
  async getStudentById(user: User | null, id: string): Promise<Student> {
    requirePermission(user, "students", "read");

    const student = await this.repo.findById(id);
    if (!student) throw AppError.notFound("Student", id);

    return student;
  }

  /**
   * Create a new student. Admin-only.
   * If email is provided, also creates a Better Auth User (role STUDENT)
   * so the student can sign in with the assigned email.
   */
  async createStudent(user: User | null, data: CreateStudentInput): Promise<Student> {
    requirePermission(user, "students", "create");

    const existing = await this.repo.findByStudentId(data.studentId);
    if (existing) {
      throw AppError.conflict(`Student with ID ${data.studentId} already exists`);
    }

    const {
      temporaryPassword,
      weeklyAmount,
      documentUrls,
      roomId: explicitRoomId,
      groupId,
      roomNumber,
      ...fields
    } = data;

    const { prisma } = await import("@/lib/db/prisma");

    let userId: string | undefined;
    let resolvedRoomId: string | undefined = explicitRoomId;
    let resolvedGroupId: string | undefined = groupId;
    let resolvedRoomNumber: string | undefined = roomNumber;

    if (groupId) {
      const group = await prisma.studentGroup.findFirst({
        where: { id: groupId, deletedAt: null, isActive: true },
      });
      if (!group) throw AppError.notFound("Student group", groupId);

      // Type room number → upsert Room under the group's hall (for schedules)
      if (roomNumber) {
        const floorInt = Number.parseInt(group.floor, 10);
        const room = await prisma.room.upsert({
          where: {
            hallId_number: { hallId: group.hallId, number: roomNumber },
          },
          update: {
            block: group.block,
            floor: Number.isFinite(floorInt) ? floorInt : undefined,
            isActive: true,
            deletedAt: null,
          },
          create: {
            hallId: group.hallId,
            number: roomNumber,
            block: group.block,
            floor: Number.isFinite(floorInt) ? floorInt : undefined,
            capacity: 2,
          },
        });
        resolvedRoomId = room.id;
        resolvedRoomNumber = roomNumber;
      }
    }

    /** Plaintext temp password — only kept long enough for the welcome SMS. */
    let plainPassword: string | undefined;

    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        const linked = await this.repo.findByUserId(existingUser.id);
        if (linked) throw AppError.conflict(`Email ${data.email} is already linked to a student`);
        userId = existingUser.id;
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            role: "STUDENT",
          },
        });
        // Existing account — do not invent a new password; student can use forgot-password.
      } else {
        // Create credential account without signing the admin out of their session.
        const { hashPassword } = await import("better-auth/crypto");
        plainPassword =
          temporaryPassword ||
          `Ww-${data.studentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "Student"}1!`;
        const hashed = await hashPassword(plainPassword);
        const createdUser = await prisma.user.create({
          data: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            emailVerified: true,
            phone: data.phone,
            phoneNumber: data.phone,
            phoneNumberVerified: false,
            role: "STUDENT",
            isActive: true,
          },
        });
        userId = createdUser.id;
        await prisma.account.create({
          data: {
            userId: createdUser.id,
            accountId: createdUser.id,
            providerId: "credential",
            password: hashed,
          },
        });
      }
    }

    const student = await this.repo.create({
      studentId: fields.studentId,
      indexNumber: fields.indexNumber,
      firstName: fields.firstName,
      lastName: fields.lastName,
      phone: fields.phone,
      secondaryPhone: fields.secondaryPhone,
      whatsapp: fields.whatsapp,
      email: fields.email,
      emergencyContact: fields.emergencyContact,
      emergencyPhone: fields.emergencyPhone,
      profileImageUrl: fields.profileImageUrl,
      documentUrls: documentUrls ?? [],
      roomNumber: resolvedRoomNumber,
      weeklyAmount: weeklyAmount != null ? weeklyAmount : 0,
      room: resolvedRoomId ? { connect: { id: resolvedRoomId } } : undefined,
      group: resolvedGroupId ? { connect: { id: resolvedGroupId } } : undefined,
      user: userId ? { connect: { id: userId } } : undefined,
    });

    // Await so serverless doesn't drop the welcome SMS on early response.
    if (student.phone) {
      await notificationService.sendWelcome({
        phone: student.phone,
        firstName: student.firstName,
        email: student.email,
        temporaryPassword: plainPassword,
      });
    }

    // Room already on a machine rotation? Tell the new roommate — do NOT
    // re-write the schedule (rotation is room-based; one slot per room).
    if (student.phone && resolvedRoomId) {
      await this.notifyExistingRoomRotation(
        student.firstName,
        student.phone,
        userId,
        resolvedRoomId
      );
    }

    return student;
  }

  /** SMS a new roommate about wash days already set for their room. */
  private async notifyExistingRoomRotation(
    firstName: string,
    phone: string,
    userId: string | undefined,
    roomId: string
  ) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const slots = await prisma.machineSchedule.findMany({
        where: { roomId, isActive: true },
        include: {
          machine: { select: { serialNumber: true, code: true, name: true } },
          room: { select: { number: true } },
        },
        orderBy: { orderIndex: "asc" },
      });
      if (!slots.length) return;

      const DAY: Record<string, string> = {
        MONDAY: "Mon",
        TUESDAY: "Tue",
        WEDNESDAY: "Wed",
        THURSDAY: "Thu",
        FRIDAY: "Fri",
        SATURDAY: "Sat",
        SUNDAY: "Sun",
      };
      const dayList = slots
        .map(
          (s) =>
            `${DAY[s.dayOfWeek] ?? s.dayOfWeek} ${s.startTime}`
        )
        .join(", ");
      const machine =
        slots[0]!.machine.code ||
        slots[0]!.machine.name ||
        slots[0]!.machine.serialNumber;
      const roomNo = slots[0]!.room.number;

      await notificationService.notify({
        phones: [phone],
        userIds: userId ? [userId] : [],
        title: "Your room is on the wash rotation",
        body: `Hi ${firstName}, Room ${roomNo} is already scheduled: ${dayList}. Machine ${machine}. You share this slot with roommates — no new schedule needed. - WeWash`,
        url: "/student",
        channels: userId ? ["SMS", "PUSH"] : ["SMS"],
      });
    } catch {
      // best-effort; welcome SMS already sent
    }
  }

  /**
   * Resend welcome / login SMS (no new password — points to Forgot password).
   */
  async resendWelcome(user: User | null, studentId: string): Promise<void> {
    requirePermission(user, "students", "update");
    const student = await this.repo.findById(studentId);
    if (!student) throw AppError.notFound("Student", studentId);
    if (!student.phone?.trim()) {
      throw AppError.badRequest("No phone number on file — cannot send SMS.");
    }
    await notificationService.sendWelcome({
      phone: student.phone,
      firstName: student.firstName,
      email: student.email,
      temporaryPassword: null,
    });
  }

  /**
   * Update an existing student.
   */
  async updateStudent(user: User | null, id: string, data: UpdateStudentInput): Promise<Student> {
    requirePermission(user, "students", "update");

    const student = await this.repo.findById(id);
    if (!student) throw AppError.notFound("Student", id);

    if (data.studentId && data.studentId !== student.studentId) {
      const existing = await this.repo.findByStudentId(data.studentId);
      if (existing) throw AppError.conflict(`Student ID ${data.studentId} is already in use`);
    }

    const {
      temporaryPassword: _pw,
      roomId,
      groupId,
      roomNumber,
      weeklyAmount,
      documentUrls,
      ...rest
    } = data;
    const updateData: Prisma.StudentUpdateInput = { ...rest };
    delete (updateData as { temporaryPassword?: string }).temporaryPassword;
    delete (updateData as { groupId?: string }).groupId;
    delete (updateData as { roomNumber?: string }).roomNumber;
    delete (updateData as { roomId?: string }).roomId;

    const { prisma } = await import("@/lib/db/prisma");

    if (groupId !== undefined) {
      if (groupId) {
        const group = await prisma.studentGroup.findFirst({
          where: { id: groupId, deletedAt: null },
        });
        if (!group) throw AppError.notFound("Student group", groupId);
        updateData.group = { connect: { id: groupId } };
      } else {
        updateData.group = { disconnect: true };
      }
    }

    if (roomNumber !== undefined) {
      updateData.roomNumber = roomNumber || null;
      const gId = groupId ?? student.groupId;
      if (roomNumber && gId) {
        const group = await prisma.studentGroup.findFirst({
          where: { id: gId, deletedAt: null },
        });
        if (group) {
          const floorInt = Number.parseInt(group.floor, 10);
          const room = await prisma.room.upsert({
            where: {
              hallId_number: { hallId: group.hallId, number: roomNumber },
            },
            update: {
              block: group.block,
              floor: Number.isFinite(floorInt) ? floorInt : undefined,
              deletedAt: null,
              isActive: true,
            },
            create: {
              hallId: group.hallId,
              number: roomNumber,
              block: group.block,
              floor: Number.isFinite(floorInt) ? floorInt : undefined,
              capacity: 2,
            },
          });
          updateData.room = { connect: { id: room.id } };
        }
      } else if (!roomNumber) {
        updateData.room = { disconnect: true };
      }
    } else if (roomId !== undefined) {
      updateData.room = roomId ? { connect: { id: roomId } } : { disconnect: true };
    }

    if (weeklyAmount !== undefined) updateData.weeklyAmount = weeklyAmount;
    if (documentUrls !== undefined) updateData.documentUrls = documentUrls;

    return this.repo.update(id, updateData);
  }

  /**
   * Soft delete a student.
   */
  async deleteStudent(user: User | null, id: string): Promise<void> {
    requirePermission(user, "students", "delete");

    const student = await this.repo.findById(id);
    if (!student) throw AppError.notFound("Student", id);

    await this.repo.delete(id);
  }
}

export const studentService = new StudentService();
