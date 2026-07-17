import { Prisma, Hall, Room } from "@prisma/client";
import { HallRepository } from "@/lib/repositories/hall.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { CreateHallInput, UpdateHallInput, CreateRoomInput, UpdateRoomInput } from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";
import { auditLogService } from "./audit-log.service";

export class HallService {
  private readonly repo: HallRepository;

  constructor() {
    this.repo = new HallRepository();
  }

  // ─── Hall Operations ─────────────────────────────────────────

  async getHalls(
    user: User | null,
    pagination: PaginationInput,
    search?: string
  ): Promise<{ data: Hall[]; total: number }> {
    requirePermission(user, "halls", "read");
    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.HallWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await this.repo.findMany({
      skip,
      take,
      where,
      orderBy: { name: "asc" },
    });

    return { data, total };
  }

  async getHallById(user: User | null, id: string): Promise<Hall> {
    requirePermission(user, "halls", "read");
    const hall = await this.repo.findById(id);
    if (!hall) throw AppError.notFound("Hall", id);
    return hall;
  }

  async createHall(user: User | null, data: CreateHallInput): Promise<Hall> {
    requirePermission(user, "halls", "create");
    
    const existingCode = await this.repo.findByCode(data.code);
    if (existingCode) throw AppError.conflict(`Hall with code ${data.code} already exists`);

    const existingName = await this.repo.findByName(data.name);
    if (existingName) throw AppError.conflict(`Hall with name ${data.name} already exists`);

    const hall = await this.repo.create(data);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "Hall",
      entityId: hall.id,
      newValues: hall,
    });
    return hall;
  }

  async updateHall(user: User | null, id: string, data: UpdateHallInput): Promise<Hall> {
    requirePermission(user, "halls", "update");

    const hall = await this.repo.findById(id);
    if (!hall) throw AppError.notFound("Hall", id);

    if (data.code && data.code !== hall.code) {
      const existing = await this.repo.findByCode(data.code);
      if (existing) throw AppError.conflict(`Code ${data.code} is already in use`);
    }

    const updated = await this.repo.update(id, data);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "Hall",
      entityId: id,
      oldValues: hall,
      newValues: updated,
    });
    return updated;
  }

  async deleteHall(user: User | null, id: string): Promise<void> {
    requirePermission(user, "halls", "delete");

    const hall = await this.repo.findById(id);
    if (!hall) throw AppError.notFound("Hall", id);

    await this.repo.delete(id);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "DELETE",
      entity: "Hall",
      entityId: id,
    });
  }

  // ─── Room Operations ─────────────────────────────────────────

  async getRooms(user: User | null, hallId: string): Promise<Room[]> {
    requirePermission(user, "rooms", "read");
    const hall = await this.repo.findById(hallId);
    if (!hall) throw AppError.notFound("Hall", hallId);
    return this.repo.findRoomsByHallId(hallId);
  }

  async getRoomById(user: User | null, id: string): Promise<Room> {
    requirePermission(user, "rooms", "read");
    const room = await this.repo.findRoomById(id);
    if (!room) throw AppError.notFound("Room", id);
    return room;
  }

  async createRoom(user: User | null, data: CreateRoomInput): Promise<Room> {
    requirePermission(user, "rooms", "create");

    const hall = await this.repo.findById(data.hallId);
    if (!hall) throw AppError.notFound("Hall", data.hallId);

    const existing = await this.repo.findRoomByNumber(data.hallId, data.number);
    if (existing) {
      throw AppError.conflict(`Room ${data.number} already exists in hall ${hall.name}`);
    }

    const room = await this.repo.createRoom({
      number: data.number,
      block: data.block,
      floor: data.floor,
      section: data.section,
      capacity: data.capacity,
      hall: { connect: { id: data.hallId } },
    });

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "Room",
      entityId: room.id,
      newValues: room,
    });
    return room;
  }

  async updateRoom(user: User | null, id: string, data: UpdateRoomInput): Promise<Room> {
    requirePermission(user, "rooms", "update");

    const room = await this.repo.findRoomById(id);
    if (!room) throw AppError.notFound("Room", id);

    if (data.number && data.number !== room.number) {
      const existing = await this.repo.findRoomByNumber(room.hallId, data.number);
      if (existing) throw AppError.conflict(`Room ${data.number} already exists in this hall`);
    }

    const { hallId, ...rest } = data; // Keep same hallId
    const updated = await this.repo.updateRoom(id, rest);
    
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "Room",
      entityId: id,
      oldValues: room,
      newValues: updated,
    });
    return updated;
  }

  async deleteRoom(user: User | null, id: string): Promise<void> {
    requirePermission(user, "rooms", "delete");

    const room = await this.repo.findRoomById(id);
    if (!room) throw AppError.notFound("Room", id);

    await this.repo.deleteRoom(id);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "DELETE",
      entity: "Room",
      entityId: id,
    });
  }
}

export const hallService = new HallService();
