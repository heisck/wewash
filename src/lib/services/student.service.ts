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
   * Self-onboarding: the signed-in user creates their own student profile,
   * choosing a hostel (hall) the admin has already created. Idempotent-ish:
   * refuses if a profile or student ID already exists.
   */
  async onboardSelf(
    user: User | null,
    data: { studentId: string; phone: string; hallId?: string; roomNumber?: string }
  ): Promise<Student> {
    if (!user) throw AppError.unauthorized("Not signed in");

    const existingProfile = await this.repo.findByUserId(user.id);
    if (existingProfile) return existingProfile; // already onboarded

    const existingId = await this.repo.findByStudentId(data.studentId);
    if (existingId) throw AppError.conflict(`Student ID ${data.studentId} is already registered`);

    const [firstName, ...rest] = (user.name || "Student").trim().split(" ");
    const lastName = rest.join(" ") || "";

    const student = await this.repo.onboard({
      userId: user.id,
      studentId: data.studentId,
      firstName,
      lastName,
      phone: data.phone,
      email: user.email ?? null,
      hallId: data.hallId,
      roomNumber: data.roomNumber,
    });

    if (student.phone) {
      void notificationService.sendWelcome(student.phone, student.firstName);
    }

    return student;
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
   * Create a new student.
   */
  async createStudent(user: User | null, data: CreateStudentInput): Promise<Student> {
    requirePermission(user, "students", "create");

    const existing = await this.repo.findByStudentId(data.studentId);
    if (existing) {
      throw AppError.conflict(`Student with ID ${data.studentId} already exists`);
    }

    const student = await this.repo.create(data);

    // Fire-and-forget welcome SMS with the app link + scan hint.
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

    return this.repo.update(id, data);
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
