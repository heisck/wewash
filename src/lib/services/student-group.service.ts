import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import type { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import type {
  CreateStudentGroupInput,
  UpdateStudentGroupInput,
  StudentGroupFilterInput,
} from "@/lib/validators";
import type { PaginationInput } from "@/lib/utils/pagination";
import { toSkipTake } from "@/lib/utils/pagination";

const groupInclude = {
  hall: { select: { id: true, name: true, code: true } },
  _count: { select: { students: true } },
} satisfies Prisma.StudentGroupInclude;

export class StudentGroupService {
  async list(
    user: User | null,
    filters: StudentGroupFilterInput,
    pagination: PaginationInput
  ) {
    requirePermission(user, "students", "read");
    const { skip, take } = toSkipTake(pagination);

    const where: Prisma.StudentGroupWhereInput = { deletedAt: null };
    if (filters.hallId) where.hallId = filters.hallId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { floor: { contains: filters.search, mode: "insensitive" } },
        { block: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.studentGroup.findMany({
        where,
        skip,
        take,
        orderBy: [{ hall: { name: "asc" } }, { floor: "asc" }, { block: "asc" }],
        include: groupInclude,
      }),
      prisma.studentGroup.count({ where }),
    ]);

    return { data, total };
  }

  async getById(user: User | null, id: string) {
    requirePermission(user, "students", "read");
    const group = await prisma.studentGroup.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...groupInclude,
        students: {
          where: { deletedAt: null },
          orderBy: { lastName: "asc" },
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            roomNumber: true,
            roomId: true,
            isActive: true,
            room: {
              select: {
                id: true,
                number: true,
                block: true,
                floor: true,
                capacity: true,
              },
            },
          },
        },
      },
    });
    if (!group) throw AppError.notFound("Student group", id);

    // Unique rooms in this group (rotation is room-based; multiple students share a room)
    const roomMap = new Map<
      string,
      {
        id: string;
        number: string;
        block: string | null;
        floor: number | null;
        studentCount: number;
        students: { id: string; firstName: string; lastName: string }[];
      }
    >();

    for (const s of group.students) {
      const roomId = s.roomId ?? s.room?.id;
      const number = s.roomNumber || s.room?.number;
      if (!roomId || !number) continue;
      const existing = roomMap.get(roomId);
      if (existing) {
        existing.studentCount += 1;
        existing.students.push({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
        });
      } else {
        roomMap.set(roomId, {
          id: roomId,
          number,
          block: s.room?.block ?? group.block,
          floor: s.room?.floor ?? null,
          studentCount: 1,
          students: [
            { id: s.id, firstName: s.firstName, lastName: s.lastName },
          ],
        });
      }
    }

    const rooms = Array.from(roomMap.values()).sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true })
    );

    return { ...group, rooms };
  }

  async create(user: User | null, data: CreateStudentGroupInput) {
    requirePermission(user, "students", "create");

    const hall = await prisma.hall.findFirst({
      where: { id: data.hallId, deletedAt: null },
    });
    if (!hall) throw AppError.notFound("Hall", data.hallId);

    try {
      return await prisma.studentGroup.create({
        data: {
          name: data.name,
          hallId: data.hallId,
          floor: data.floor,
          block: data.block,
          notes: data.notes ?? undefined,
        },
        include: groupInclude,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw AppError.conflict(
          "A group with this name already exists for that floor and block."
        );
      }
      throw e;
    }
  }

  async update(user: User | null, id: string, data: UpdateStudentGroupInput) {
    requirePermission(user, "students", "update");

    const existing = await prisma.studentGroup.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound("Student group", id);

    if (data.hallId) {
      const hall = await prisma.hall.findFirst({
        where: { id: data.hallId, deletedAt: null },
      });
      if (!hall) throw AppError.notFound("Hall", data.hallId);
    }

    try {
      return await prisma.studentGroup.update({
        where: { id },
        data: {
          name: data.name,
          hallId: data.hallId,
          floor: data.floor,
          block: data.block,
          notes: data.notes === null ? null : data.notes,
          isActive: data.isActive,
        },
        include: groupInclude,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw AppError.conflict(
          "A group with this name already exists for that floor and block."
        );
      }
      throw e;
    }
  }

  async softDelete(user: User | null, id: string) {
    requirePermission(user, "students", "delete");

    const existing = await prisma.studentGroup.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { students: true } } },
    });
    if (!existing) throw AppError.notFound("Student group", id);

    // Unlink students, keep their room data
    await prisma.$transaction([
      prisma.student.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      }),
      prisma.studentGroup.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      }),
    ]);

    return { id, unlinkedStudents: existing._count.students };
  }
}

export const studentGroupService = new StudentGroupService();
