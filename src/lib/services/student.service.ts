import { Prisma, Student } from "@prisma/client";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { CreateStudentInput, UpdateStudentInput, StudentFilterInput } from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";
import { notificationService } from "./notification.service";

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
        room: { include: { hall: true } },
        group: { include: { hall: true } },
      },
    });

    return { data, total };
  }

  /**
   * Get the current user's own student profile (with room + hall).
   * Returns null if the signed-in user has no student record yet.
   */
  async getMyProfile(user: User | null) {
    if (!user) throw AppError.unauthorized("Not signed in");
    return this.repo.findByUserIdDetailed(user.id);
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

    if (student.phone) {
      void notificationService.sendWelcome({
        phone: student.phone,
        firstName: student.firstName,
        email: student.email,
        temporaryPassword: plainPassword,
      });
    }

    return student;
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
