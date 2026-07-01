import { Prisma, FaultReport, MaintenanceLog, TransferLog } from "@prisma/client";
import { FaultRepository } from "@/lib/repositories/fault.repository";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { MachineRepository } from "@/lib/repositories/machine.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import {
  CreateFaultReportInput,
  UpdateFaultReportInput,
  CreateMaintenanceLogInput,
  CreateTransferLogInput,
} from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";
import { auditLogService } from "./audit-log.service";

export class FaultService {
  private readonly repo: FaultRepository;
  private readonly studentRepo: StudentRepository;
  private readonly machineRepo: MachineRepository;

  constructor() {
    this.repo = new FaultRepository();
    this.studentRepo = new StudentRepository();
    this.machineRepo = new MachineRepository();
  }

  private async getStudentIdForUser(user: User | null): Promise<string | undefined> {
    if (!user) return undefined;
    if (user.role === "STUDENT") {
      const student = await this.studentRepo.findByUserId(user.id);
      if (!student) throw AppError.notFound("Student profile not found for user", user.id);
      return student.id;
    }
    return undefined;
  }

  // ─── Fault Reports ───────────────────────────────────────────

  async getFaults(
    user: User | null,
    filters: { machineId?: string; status?: any; severity?: any; studentId?: string },
    pagination: PaginationInput
  ): Promise<{ data: FaultReport[]; total: number }> {
    requirePermission(user, "faults", "read");
    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.FaultReportWhereInput = {};

    const studentId = await this.getStudentIdForUser(user);
    if (studentId) {
      where.reportedById = studentId;
    } else if (filters.studentId) {
      where.reportedById = filters.studentId;
    }

    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;

    const [data, total] = await this.repo.findManyFaults({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: { machine: true, reportedBy: true },
    });

    return { data, total };
  }

  async getFaultById(user: User | null, id: string): Promise<FaultReport> {
    requirePermission(user, "faults", "read");
    const fault = await this.repo.findFaultById(id);
    if (!fault) throw AppError.notFound("FaultReport", id);

    const studentId = await this.getStudentIdForUser(user);
    if (studentId && fault.reportedById !== studentId) {
      throw AppError.forbidden("You do not have access to this fault report.");
    }

    return fault;
  }

  async createFault(user: User | null, data: CreateFaultReportInput): Promise<FaultReport> {
    requirePermission(user, "faults", "create");

    let reportedById = data.reportedById;
    const studentId = await this.getStudentIdForUser(user);
    if (studentId) {
      reportedById = studentId;
    }

    const student = await this.studentRepo.findById(reportedById);
    if (!student) throw AppError.notFound("Student", reportedById);

    const machine = await this.machineRepo.findById(data.machineId);
    if (!machine) throw AppError.notFound("Machine", data.machineId);

    // Create the fault report
    const fault = await this.repo.createFault({
      title: data.title,
      description: data.description,
      severity: data.severity,
      imageUrls: data.imageUrls || [],
      machine: { connect: { id: data.machineId } },
      reportedBy: { connect: { id: reportedById } },
    });

    // Automatically update machine status to FAULTY
    await this.machineRepo.update(data.machineId, { status: "FAULTY" });

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "FaultReport",
      entityId: fault.id,
      newValues: fault,
    });

    return fault;
  }

  async updateFault(user: User | null, id: string, data: UpdateFaultReportInput): Promise<FaultReport> {
    requirePermission(user, "faults", "update");

    const fault = await this.repo.findFaultById(id);
    if (!fault) throw AppError.notFound("FaultReport", id);

    const studentId = await this.getStudentIdForUser(user);
    if (studentId && fault.reportedById !== studentId) {
      throw AppError.forbidden("You cannot update this fault report.");
    }

    const updateData: Prisma.FaultReportUpdateInput = {};
    if (data.status) updateData.status = data.status;
    if (data.resolution) updateData.resolution = data.resolution;
    if (data.estimatedCost) updateData.estimatedCost = new Prisma.Decimal(data.estimatedCost);
    if (data.actualCost) updateData.actualCost = new Prisma.Decimal(data.actualCost);
    if (data.severity) updateData.severity = data.severity;
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;

    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user?.id ?? null;
      // Revert machine status to ACTIVE
      await this.machineRepo.update(fault.machineId, { status: "ACTIVE" });
    }

    const updated = await this.repo.updateFault(id, updateData);

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "FaultReport",
      entityId: id,
      oldValues: fault,
      newValues: updated,
    });

    return updated;
  }

  async deleteFault(user: User | null, id: string): Promise<void> {
    requirePermission(user, "faults", "delete");

    const fault = await this.repo.findFaultById(id);
    if (!fault) throw AppError.notFound("FaultReport", id);

    await this.repo.deleteFault(id);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "DELETE",
      entity: "FaultReport",
      entityId: id,
    });
  }

  // ─── Maintenance Logs ────────────────────────────────────────

  async getMaintenanceLogs(
    user: User | null,
    machineId: string,
    pagination: PaginationInput
  ): Promise<{ data: MaintenanceLog[]; total: number }> {
    requirePermission(user, "machines", "read");
    const { skip, take } = toSkipTake(pagination);

    const [data, total] = await this.repo.findManyMaintenanceLogs({
      skip,
      take,
      where: { machineId },
      orderBy: { createdAt: "desc" },
    });

    return { data, total };
  }

  async createMaintenanceLog(user: User | null, data: CreateMaintenanceLogInput): Promise<MaintenanceLog> {
    requirePermission(user, "machines", "update");

    const machine = await this.machineRepo.findById(data.machineId);
    if (!machine) throw AppError.notFound("Machine", data.machineId);

    const log = await this.repo.createMaintenanceLog({
      machine: { connect: { id: data.machineId } },
      type: data.type,
      description: data.description,
      cost: data.cost ? new Prisma.Decimal(data.cost) : undefined,
      scheduledDate: data.scheduledDate,
      completedDate: data.completedDate,
      nextDueDate: data.nextDueDate,
      notes: data.notes,
      performedBy: user?.name ?? "Technician",
    });

    // Update machine status to MAINTENANCE during log creation if scheduling/completing maintenance
    if (!data.completedDate) {
      await this.machineRepo.update(data.machineId, { status: "MAINTENANCE" });
    } else {
      await this.machineRepo.update(data.machineId, { status: "ACTIVE" });
    }

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "MaintenanceLog",
      entityId: log.id,
      newValues: log,
    });

    return log;
  }

  // ─── Transfer Logs ───────────────────────────────────────────

  async getTransferLogs(
    user: User | null,
    machineId: string,
    pagination: PaginationInput
  ): Promise<{ data: TransferLog[]; total: number }> {
    requirePermission(user, "machines", "read");
    const { skip, take } = toSkipTake(pagination);

    const [data, total] = await this.repo.findManyTransferLogs({
      skip,
      take,
      where: { machineId },
      orderBy: { transferredAt: "desc" },
    });

    return { data, total };
  }

  async createTransferLog(user: User | null, data: CreateTransferLogInput): Promise<TransferLog> {
    requirePermission(user, "machines", "update");

    const machine = await this.machineRepo.findById(data.machineId);
    if (!machine) throw AppError.notFound("Machine", data.machineId);

    const log = await this.repo.createTransferLog({
      machine: { connect: { id: data.machineId } },
      fromHallId: data.fromHallId || machine.hallId || undefined,
      fromRoomInfo: data.fromRoomInfo,
      toHallId: data.toHallId,
      toRoomInfo: data.toRoomInfo,
      reason: data.reason,
      notes: data.notes,
      transferredBy: user?.id ?? null,
    });

    // Physically move the machine to the new Hall
    if (data.toHallId) {
      await this.machineRepo.update(data.machineId, {
        hall: { connect: { id: data.toHallId } },
      });
    }

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "TransferLog",
      entityId: log.id,
      newValues: log,
    });

    return log;
  }
}

export const faultService = new FaultService();
