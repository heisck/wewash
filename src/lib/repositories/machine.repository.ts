import { Prisma, Machine, MachineSchedule } from "@prisma/client";
import { BaseRepository, FindManyOptions } from "./base.repository";

export class MachineRepository extends BaseRepository {
  /**
   * Find a machine by ID. Excludes soft-deleted.
   */
  async findById(id: string): Promise<Machine | null> {
    return this.db.machine.findFirst({
      where: { id, deletedAt: null },
      include: { hall: true },
    });
  }

  /**
   * Find a machine by serial number.
   */
  async findBySerialNumber(serialNumber: string): Promise<Machine | null> {
    return this.db.machine.findFirst({
      where: { serialNumber, deletedAt: null },
    });
  }

  /**
   * Find many machines with pagination and filters.
   */
  async findMany(options: FindManyOptions): Promise<[Machine[], number]> {
    const { skip, take, orderBy, where, include } = options;

    const baseWhere: Prisma.MachineWhereInput = {
      deletedAt: null,
      ...where,
    };

    const [items, total] = await Promise.all([
      this.db.machine.findMany({ skip, take, orderBy, where: baseWhere, include }),
      this.db.machine.count({ where: baseWhere }),
    ]);

    return [items, total];
  }

  /**
   * Create a new machine.
   */
  async create(data: Prisma.MachineCreateInput): Promise<Machine> {
    return this.db.machine.create({ data });
  }

  /**
   * Update a machine.
   */
  async update(id: string, data: Prisma.MachineUpdateInput): Promise<Machine> {
    return this.db.machine.update({ where: { id }, data });
  }

  /**
   * Soft delete a machine.
   */
  async delete(id: string): Promise<Machine> {
    return this.db.machine.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: "DECOMMISSIONED" },
    });
  }

  // ─── Machine Schedule ──────────────────────────────────────

  /**
   * Get the full weekly schedule for a machine.
   */
  async getSchedule(machineId: string): Promise<MachineSchedule[]> {
    return this.db.machineSchedule.findMany({
      where: { machineId },
      orderBy: { orderIndex: "asc" },
      include: { room: true },
    });
  }

  /**
   * Replace the entire weekly schedule for a machine in a transaction.
   */
  async replaceSchedule(machineId: string, schedules: Prisma.MachineScheduleCreateManyInput[]): Promise<void> {
    await this.transaction(async (tx) => {
      // Delete existing
      await tx.machineSchedule.deleteMany({ where: { machineId } });
      // Insert new
      await tx.machineSchedule.createMany({ data: schedules });
    });
  }
}
