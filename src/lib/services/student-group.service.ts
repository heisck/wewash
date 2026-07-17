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

    // Unique rooms in this group (rotation is room-based; multiple students share a room).
    // Sources: students in group, rooms tagged with this block, rooms already on a schedule.
    type RoomRow = {
      id: string;
      number: string;
      block: string | null;
      floor: number | null;
      studentCount: number;
      students: { id: string; firstName: string; lastName: string }[];
    };
    const roomMap = new Map<string, RoomRow>();

    const ensureRoom = (
      id: string,
      number: string,
      block: string | null,
      floor: number | null
    ) => {
      if (!roomMap.has(id)) {
        roomMap.set(id, {
          id,
          number,
          block,
          floor,
          studentCount: 0,
          students: [],
        });
      }
      return roomMap.get(id)!;
    };

    for (const s of group.students) {
      const roomId = s.roomId ?? s.room?.id;
      const number = s.roomNumber || s.room?.number;
      if (!roomId || !number) continue;
      const row = ensureRoom(
        roomId,
        number,
        s.room?.block ?? group.block,
        s.room?.floor ?? null
      );
      row.studentCount += 1;
      row.students.push({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
      });
    }

    // Rooms under this hostel with the same block (added via Rotation "Add room")
    const blockRooms = await prisma.room.findMany({
      where: {
        hallId: group.hallId,
        deletedAt: null,
        isActive: true,
        block: group.block,
      },
      select: {
        id: true,
        number: true,
        block: true,
        floor: true,
      },
    });
    for (const r of blockRooms) {
      ensureRoom(r.id, r.number, r.block, r.floor);
    }

    // Rooms already scheduled on any machine in this hostel (even if empty of students)
    const scheduled = await prisma.machineSchedule.findMany({
      where: {
        isActive: true,
        room: { hallId: group.hallId, deletedAt: null },
      },
      select: {
        room: {
          select: { id: true, number: true, block: true, floor: true },
        },
      },
    });
    for (const s of scheduled) {
      const r = s.room;
      if (!r) continue;
      // Prefer same block; still include if already has group students
      if (r.block && r.block !== group.block && !roomMap.has(r.id)) continue;
      ensureRoom(r.id, r.number, r.block, r.floor);
    }

    const rooms = Array.from(roomMap.values()).sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true })
    );

    return { ...group, rooms };
  }

  /**
   * Add (or revive) a room under this group's hostel/block for rotation.
   * Does not change any machine schedule — admin assigns days separately.
   * New roommates join an existing scheduled room without re-adding the room.
   */
  async addRoom(
    user: User | null,
    groupId: string,
    roomNumber: string
  ) {
    requirePermission(user, "students", "update");
    const number = roomNumber.trim();
    if (!number) throw AppError.badRequest("Room number is required");

    const group = await prisma.studentGroup.findFirst({
      where: { id: groupId, deletedAt: null },
    });
    if (!group) throw AppError.notFound("Student group", groupId);

    const floorInt = Number.parseInt(group.floor, 10);
    const room = await prisma.room.upsert({
      where: {
        hallId_number: { hallId: group.hallId, number },
      },
      update: {
        block: group.block,
        floor: Number.isFinite(floorInt) ? floorInt : undefined,
        isActive: true,
        deletedAt: null,
      },
      create: {
        hallId: group.hallId,
        number,
        block: group.block,
        floor: Number.isFinite(floorInt) ? floorInt : undefined,
        capacity: 2,
      },
    });

    return room;
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
