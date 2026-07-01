import { Prisma, FaultReport, MaintenanceLog, TransferLog } from "@prisma/client";
import { BaseRepository, FindManyOptions } from "./base.repository";

export class FaultRepository extends BaseRepository {
  // ─── Fault Report Operations ─────────────────────────────────

  async findFaultById(id: string): Promise<FaultReport | null> {
    return this.db.faultReport.findFirst({
      where: { id, deletedAt: null },
      include: { machine: true, reportedBy: true },
    });
  }

  async findManyFaults(options: FindManyOptions): Promise<[FaultReport[], number]> {
    const { skip, take, orderBy, where, include } = options;
    const baseWhere: Prisma.FaultReportWhereInput = {
      deletedAt: null,
      ...where,
    };

    const [items, total] = await Promise.all([
      this.db.faultReport.findMany({ skip, take, orderBy, where: baseWhere, include }),
      this.db.faultReport.count({ where: baseWhere }),
    ]);

    return [items, total];
  }

  async createFault(data: Prisma.FaultReportCreateInput): Promise<FaultReport> {
    return this.db.faultReport.create({ data });
  }

  async updateFault(id: string, data: Prisma.FaultReportUpdateInput): Promise<FaultReport> {
    return this.db.faultReport.update({ where: { id }, data });
  }

  async deleteFault(id: string): Promise<FaultReport> {
    return this.db.faultReport.update({
      where: { id },
      data: { deletedAt: new Date(), status: "CLOSED" },
    });
  }

  // ─── Maintenance Log Operations ──────────────────────────────

  async findMaintenanceLogById(id: string): Promise<MaintenanceLog | null> {
    return this.db.maintenanceLog.findUnique({
      where: { id },
      include: { machine: true },
    });
  }

  async findManyMaintenanceLogs(options: FindManyOptions): Promise<[MaintenanceLog[], number]> {
    const { skip, take, orderBy, where, include } = options;

    const [items, total] = await Promise.all([
      this.db.maintenanceLog.findMany({ skip, take, orderBy, where, include }),
      this.db.maintenanceLog.count({ where }),
    ]);

    return [items, total];
  }

  async createMaintenanceLog(data: Prisma.MaintenanceLogCreateInput): Promise<MaintenanceLog> {
    return this.db.maintenanceLog.create({ data });
  }

  // ─── Transfer Log Operations ─────────────────────────────────

  async findTransferLogById(id: string): Promise<TransferLog | null> {
    return this.db.transferLog.findUnique({
      where: { id },
      include: { machine: true },
    });
  }

  async findManyTransferLogs(options: FindManyOptions): Promise<[TransferLog[], number]> {
    const { skip, take, orderBy, where, include } = options;

    const [items, total] = await Promise.all([
      this.db.transferLog.findMany({ skip, take, orderBy, where, include }),
      this.db.transferLog.count({ where }),
    ]);

    return [items, total];
  }

  async createTransferLog(data: Prisma.TransferLogCreateInput): Promise<TransferLog> {
    return this.db.transferLog.create({ data });
  }
}
