import { Prisma, Student } from "@prisma/client";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { CreateStudentInput, UpdateStudentInput, StudentFilterInput } from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";

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

    return this.repo.create(data);
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
