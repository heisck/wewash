import { Prisma, Hall, Room } from "@prisma/client";
import { BaseRepository, FindManyOptions } from "./base.repository";

export class HallRepository extends BaseRepository {
  // ─── Hall Operations ─────────────────────────────────────────

  async findById(id: string): Promise<Hall | null> {
    return this.db.hall.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string): Promise<Hall | null> {
    return this.db.hall.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async findByName(name: string): Promise<Hall | null> {
    return this.db.hall.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async findMany(options: FindManyOptions): Promise<[Hall[], number]> {
    const { skip, take, orderBy, where, include } = options;
    const baseWhere: Prisma.HallWhereInput = {
      deletedAt: null,
      ...where,
    };

    const [items, total] = await Promise.all([
      this.db.hall.findMany({ skip, take, orderBy, where: baseWhere, include }),
      this.db.hall.count({ where: baseWhere }),
    ]);

    return [items, total];
  }

  async create(data: Prisma.HallCreateInput): Promise<Hall> {
    return this.db.hall.create({ data });
  }

  async update(id: string, data: Prisma.HallUpdateInput): Promise<Hall> {
    return this.db.hall.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Hall> {
    return this.db.hall.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ─── Room Operations ─────────────────────────────────────────

  async findRoomById(id: string): Promise<Room | null> {
    return this.db.room.findFirst({
      where: { id, deletedAt: null },
      include: { hall: true },
    });
  }

  async findRoomByNumber(hallId: string, number: string): Promise<Room | null> {
    return this.db.room.findFirst({
      where: { hallId, number, deletedAt: null },
    });
  }

  async findRoomsByHallId(hallId: string): Promise<Room[]> {
    return this.db.room.findMany({
      where: { hallId, deletedAt: null },
      orderBy: { number: "asc" },
    });
  }

  async createRoom(data: Prisma.RoomCreateInput): Promise<Room> {
    return this.db.room.create({ data });
  }

  async updateRoom(id: string, data: Prisma.RoomUpdateInput): Promise<Room> {
    return this.db.room.update({ where: { id }, data });
  }

  async deleteRoom(id: string): Promise<Room> {
    return this.db.room.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
