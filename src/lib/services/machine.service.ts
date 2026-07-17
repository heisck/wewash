import { randomBytes } from "node:crypto";
import { Prisma, Machine, MachineSchedule } from "@prisma/client";
import { MachineRepository } from "@/lib/repositories/machine.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import {
  CreateMachineInput,
  UpdateMachineInput,
  MachineFilterInput,
  BulkMachineScheduleInput,
} from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";

export class MachineService {
  private readonly repo: MachineRepository;

  constructor() {
    this.repo = new MachineRepository();
  }

  /**
   * Get paginated machines.
   */
  async getMachines(
    user: User | null,
    filters: MachineFilterInput,
    pagination: PaginationInput
  ): Promise<{ data: Machine[]; total: number }> {
    requirePermission(user, "machines", "read");

    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.MachineWhereInput = {};

    if (filters.search) {
      where.OR = [
        { serialNumber: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
        { brand: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.hallId) where.hallId = filters.hallId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await this.repo.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        hall: true,
        machineSchedules: {
          where: { isActive: true },
          include: { room: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return { data, total };
  }

  /**
   * Get a machine by ID with its full rotation schedule.
   */
  async getMachineDetails(
    user: User | null,
    id: string
  ): Promise<Machine & { schedules: MachineSchedule[] }> {
    requirePermission(user, "machines", "read");

    const machine = await this.repo.findById(id);
    if (!machine) throw AppError.notFound("Machine", id);

    const schedules = await this.repo.getSchedule(id);

    return { ...machine, schedules };
  }

  /**
   * Create a new machine.
   */
  async createMachine(user: User | null, data: CreateMachineInput): Promise<Machine> {
    requirePermission(user, "machines", "create");

    const existing = await this.repo.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw AppError.conflict(`Machine with serial ${data.serialNumber} exists`);
    }

    // Each machine gets an opaque QR token embedded in its printed QR code.
    const qrToken = randomBytes(16).toString("hex");
    const {
      hallId,
      purchaseDate,
      installationDate,
      warrantyExpiry,
      serialNumber,
      name,
      code,
      brand,
      model,
      capacityKg,
      machineType,
      notes,
    } = data;

    return this.repo.create({
      serialNumber,
      name,
      code,
      brand,
      model,
      capacityKg,
      machineType,
      notes,
      qrToken,
      purchaseDate: purchaseDate ?? undefined,
      installationDate: installationDate ?? undefined,
      warrantyExpiry: warrantyExpiry ?? undefined,
      hall: hallId ? { connect: { id: hallId } } : undefined,
    });
  }

  /**
   * Ensure a machine has a qrToken (backfill for machines created before QR
   * tokens existed), returning the token.
   */
  async ensureQrToken(user: User | null, id: string): Promise<string> {
    requirePermission(user, "machines", "read");
    const machine = await this.repo.findById(id);
    if (!machine) throw AppError.notFound("Machine", id);
    if (machine.qrToken) return machine.qrToken;
    const qrToken = randomBytes(16).toString("hex");
    await this.repo.update(id, { qrToken });
    return qrToken;
  }

  /**
   * Update machine details.
   */
  async updateMachine(user: User | null, id: string, data: UpdateMachineInput): Promise<Machine> {
    requirePermission(user, "machines", "update");

    const machine = await this.repo.findById(id);
    if (!machine) throw AppError.notFound("Machine", id);

    if (data.serialNumber && data.serialNumber !== machine.serialNumber) {
      const existing = await this.repo.findBySerialNumber(data.serialNumber);
      if (existing) throw AppError.conflict("Serial number already in use");
    }

    const { hallId, purchaseDate, installationDate, warrantyExpiry, ...rest } = data;
    const updateData: Prisma.MachineUpdateInput = { ...rest };
    if (hallId !== undefined) {
      updateData.hall = hallId ? { connect: { id: hallId } } : { disconnect: true };
    }
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate;
    if (installationDate !== undefined) updateData.installationDate = installationDate;
    if (warrantyExpiry !== undefined) updateData.warrantyExpiry = warrantyExpiry;

    return this.repo.update(id, updateData);
  }

  /**
   * Replace the full 7-day rotation schedule for a machine.
   */
  async replaceSchedule(user: User | null, data: BulkMachineScheduleInput): Promise<void> {
    requirePermission(user, "schedules", "update");

    const machine = await this.repo.findById(data.machineId);
    if (!machine) throw AppError.notFound("Machine", data.machineId);

    // Ensure no duplicate days in payload
    const days = data.schedules.map((s) => s.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw AppError.badRequest("Schedule contains duplicate days of the week");
    }

    const scheduleData = data.schedules.map((s) => ({
      machineId: data.machineId,
      roomId: s.roomId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      orderIndex: s.orderIndex,
    }));

    await this.repo.replaceSchedule(data.machineId, scheduleData);
  }
}

export const machineService = new MachineService();
