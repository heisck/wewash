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

    if (filters.search) {
      where.OR = [
        { studentId: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await this.repo.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: { room: { include: { hall: true } } },
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

    const { temporaryPassword, weeklyAmount, documentUrls, roomId, ...fields } = data;

    let userId: string | undefined;

    if (data.email) {
      const { prisma } = await import("@/lib/db/prisma");
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
      } else {
        // Create credential account without signing the admin out of their session.
        const { hashPassword } = await import("better-auth/crypto");
        const password =
          temporaryPassword ||
          `Ww-${data.studentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "Student"}1!`;
        const hashed = await hashPassword(password);
        const createdUser = await prisma.user.create({
          data: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            emailVerified: true,
            phone: data.phone,
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
      weeklyAmount: weeklyAmount != null ? weeklyAmount : 0,
      room: roomId ? { connect: { id: roomId } } : undefined,
      user: userId ? { connect: { id: userId } } : undefined,
    });

    if (student.phone) {
      void notificationService.sendWelcome(student.phone, student.firstName);
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

    const { temporaryPassword: _pw, roomId, weeklyAmount, documentUrls, ...rest } = data;
    const updateData: Prisma.StudentUpdateInput = { ...rest };
    if (roomId !== undefined) {
      updateData.room = roomId ? { connect: { id: roomId } } : { disconnect: true };
    }
    if (weeklyAmount !== undefined) updateData.weeklyAmount = weeklyAmount;
    if (documentUrls !== undefined) updateData.documentUrls = documentUrls;
    // Don't pass temporaryPassword into Prisma
    delete (updateData as { temporaryPassword?: string }).temporaryPassword;

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
