import { Prisma, Student } from "@prisma/client";
import { BaseRepository, FindManyOptions } from "./base.repository";

export class StudentRepository extends BaseRepository {
  /**
   * Find a student by ID. Excludes soft-deleted.
   */
  async findById(id: string): Promise<Student | null> {
    return this.db.student.findFirst({
      where: { id, deletedAt: null },
      include: { room: { include: { hall: true } }, user: true },
    });
  }

  /**
   * Find a student by university student ID.
   */
  async findByStudentId(studentId: string): Promise<Student | null> {
    return this.db.student.findFirst({
      where: { studentId, deletedAt: null },
    });
  }

  /**
   * Find a student by Better Auth User ID.
   */
  async findByUserId(userId: string): Promise<Student | null> {
    return this.db.student.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  /**
   * Find a student by User ID, including room + hall (for the "me" endpoint).
   */
  async findByUserIdDetailed(userId: string) {
    return this.db.student.findFirst({
      where: { userId, deletedAt: null },
      include: { room: { include: { hall: true } } },
    });
  }

  /**
   * Find-or-create a room within a hall (used during student self-onboarding),
   * then create the student linked to the auth user — all in one transaction.
   */
  async onboard(params: {
    userId: string;
    studentId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    hallId?: string;
    roomNumber?: string;
  }): Promise<Student> {
    return this.transaction(async (tx) => {
      let roomId: string | undefined;
      if (params.hallId && params.roomNumber) {
        const room = await tx.room.upsert({
          where: { hallId_number: { hallId: params.hallId, number: params.roomNumber } },
          update: {},
          create: { hallId: params.hallId, number: params.roomNumber, capacity: 2 },
        });
        roomId = room.id;
      }

      return tx.student.create({
        data: {
          studentId: params.studentId,
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
          email: params.email ?? undefined,
          userId: params.userId,
          roomId,
        },
      });
    });
  }

  /**
   * Find many students with pagination and filters.
   */
  async findMany(options: FindManyOptions): Promise<[Student[], number]> {
    const { skip, take, orderBy, where, include } = options;

    const baseWhere: Prisma.StudentWhereInput = {
      deletedAt: null,
      ...where,
    };

    const [items, total] = await Promise.all([
      this.db.student.findMany({
        skip,
        take,
        orderBy,
        where: baseWhere,
        include,
      }),
      this.db.student.count({ where: baseWhere }),
    ]);

    return [items, total];
  }

  /**
   * Create a new student.
   */
  async create(data: Prisma.StudentCreateInput): Promise<Student> {
    return this.db.student.create({ data });
  }

  /**
   * Update a student.
   */
  async update(id: string, data: Prisma.StudentUpdateInput): Promise<Student> {
    return this.db.student.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a student.
   */
  async delete(id: string): Promise<Student> {
    return this.db.student.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
