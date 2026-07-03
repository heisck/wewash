import { Prisma, Contract, Payment } from "@prisma/client";
import { FinanceRepository } from "@/lib/repositories/finance.repository";
import { StudentRepository } from "@/lib/repositories/student.repository";
import { MachineRepository } from "@/lib/repositories/machine.repository";
import { AppError } from "@/lib/errors";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import {
  CreateContractInput,
  UpdateContractInput,
  CreatePaymentInput,
  UpdatePaymentInput,
} from "@/lib/validators";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";
import { auditLogService } from "./audit-log.service";
import { notificationService } from "./notification.service";

export class FinanceService {
  private readonly repo: FinanceRepository;
  private readonly studentRepo: StudentRepository;
  private readonly machineRepo: MachineRepository;

  constructor() {
    this.repo = new FinanceRepository();
    this.studentRepo = new StudentRepository();
    this.machineRepo = new MachineRepository();
  }

  // ─── Contract Operations ─────────────────────────────────────

  async getContracts(
    user: User | null,
    filters: { studentId?: string; machineId?: string; status?: Prisma.EnumContractStatusFilter | any },
    pagination: PaginationInput
  ): Promise<{ data: Contract[]; total: number }> {
    requirePermission(user, "contracts", "read");
    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.ContractWhereInput = {};

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.repo.findManyContracts({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: { student: true, machine: true },
    });

    return { data, total };
  }

  async getContractById(user: User | null, id: string): Promise<Contract> {
    requirePermission(user, "contracts", "read");
    const contract = await this.repo.findContractById(id);
    if (!contract) throw AppError.notFound("Contract", id);
    return contract;
  }

  async createContract(user: User | null, data: CreateContractInput): Promise<Contract> {
    requirePermission(user, "contracts", "create");

    const student = await this.studentRepo.findById(data.studentId);
    if (!student) throw AppError.notFound("Student", data.studentId);

    const machine = await this.machineRepo.findById(data.machineId);
    if (!machine) throw AppError.notFound("Machine", data.machineId);

    // Check for existing active contract for this student
    const [existing] = await this.repo.findManyContracts({
      take: 1,
      where: { studentId: data.studentId, status: "ACTIVE" },
    });
    if (existing.length > 0) {
      throw AppError.conflict("Student already has an active contract");
    }

    const contract = await this.repo.createContract({
      student: { connect: { id: data.studentId } },
      machine: { connect: { id: data.machineId } },
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyAmount: new Prisma.Decimal(data.monthlyAmount),
      currency: data.currency,
      terms: data.terms,
      status: "ACTIVE", // Automatically active on creation for convenience
    });

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "Contract",
      entityId: contract.id,
      newValues: contract,
    });
    return contract;
  }

  async updateContract(user: User | null, id: string, data: UpdateContractInput): Promise<Contract> {
    requirePermission(user, "contracts", "update");

    const contract = await this.repo.findContractById(id);
    if (!contract) throw AppError.notFound("Contract", id);

    const updateData: Prisma.ContractUpdateInput = {};
    if (data.status) updateData.status = data.status;
    if (data.startDate) updateData.startDate = data.startDate;
    if (data.endDate) updateData.endDate = data.endDate;
    if (data.monthlyAmount) updateData.monthlyAmount = new Prisma.Decimal(data.monthlyAmount);
    if (data.terms) updateData.terms = data.terms;
    if (data.terminationNote) updateData.terminationNote = data.terminationNote;

    const updated = await this.repo.updateContract(id, updateData);

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "Contract",
      entityId: id,
      oldValues: contract,
      newValues: updated,
    });
    return updated;
  }

  async deleteContract(user: User | null, id: string): Promise<void> {
    requirePermission(user, "contracts", "delete");

    const contract = await this.repo.findContractById(id);
    if (!contract) throw AppError.notFound("Contract", id);

    await this.repo.deleteContract(id);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "DELETE",
      entity: "Contract",
      entityId: id,
    });
  }

  // ─── Payment Operations ──────────────────────────────────────

  async getPayments(
    user: User | null,
    filters: { studentId?: string; contractId?: string; status?: any; method?: any },
    pagination: PaginationInput
  ): Promise<{ data: Payment[]; total: number }> {
    requirePermission(user, "payments", "read");
    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.PaymentWhereInput = {};

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.contractId) where.contractId = filters.contractId;
    if (filters.status) where.status = filters.status;
    if (filters.method) where.method = filters.method;

    const [data, total] = await this.repo.findManyPayments({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: { student: true, contract: true },
    });

    return { data, total };
  }

  async getPaymentById(user: User | null, id: string): Promise<Payment> {
    requirePermission(user, "payments", "read");
    const payment = await this.repo.findPaymentById(id);
    if (!payment) throw AppError.notFound("Payment", id);
    return payment;
  }

  async createPayment(user: User | null, data: CreatePaymentInput): Promise<Payment> {
    requirePermission(user, "payments", "create");

    const student = await this.studentRepo.findById(data.studentId);
    if (!student) throw AppError.notFound("Student", data.studentId);

    if (data.contractId) {
      const contract = await this.repo.findContractById(data.contractId);
      if (!contract) throw AppError.notFound("Contract", data.contractId);
    }

    if (data.reference) {
      const existing = await this.repo.findPaymentByReference(data.reference);
      if (existing) throw AppError.conflict("Payment reference already exists");
    }

    const payment = await this.repo.createPayment({
      student: { connect: { id: data.studentId } },
      contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
      amount: new Prisma.Decimal(data.amount),
      currency: data.currency,
      method: data.method,
      reference: data.reference,
      description: data.description,
      dueDate: data.dueDate,
      paidAt: data.paidAt || new Date(),
      status: "COMPLETED", // Assuming manually recorded payment by admin is completed
      recordedBy: user?.id ?? null,
    });

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "Payment",
      entityId: payment.id,
      newValues: payment,
    });

    // Notify the student their payment was confirmed (SMS + push).
    void notificationService.notify({
      userIds: student.userId ? [student.userId] : [],
      phones: [student.phone],
      title: "Payment confirmed",
      body: `We received your payment of GHS ${data.amount}. Thank you! - WeWash`,
      url: "/student/billing",
    });

    return payment;
  }

  async updatePayment(user: User | null, id: string, data: UpdatePaymentInput): Promise<Payment> {
    requirePermission(user, "payments", "update");

    const payment = await this.repo.findPaymentById(id);
    if (!payment) throw AppError.notFound("Payment", id);

    const updateData: Prisma.PaymentUpdateInput = {};
    if (data.status) updateData.status = data.status;
    if (data.amount) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.method) updateData.method = data.method;
    if (data.reference) updateData.reference = data.reference;
    if (data.description) updateData.description = data.description;
    if (data.dueDate) updateData.dueDate = data.dueDate;
    if (data.paidAt) updateData.paidAt = data.paidAt;
    if (data.notes) updateData.notes = data.notes;

    const updated = await this.repo.updatePayment(id, updateData);

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "Payment",
      entityId: id,
      oldValues: payment,
      newValues: updated,
    });
    return updated;
  }

  async deletePayment(user: User | null, id: string): Promise<void> {
    requirePermission(user, "payments", "delete");

    const payment = await this.repo.findPaymentById(id);
    if (!payment) throw AppError.notFound("Payment", id);

    await this.repo.deletePayment(id);
    await auditLogService.log({
      userId: user?.id ?? null,
      action: "DELETE",
      entity: "Payment",
      entityId: id,
    });
  }
}

export const financeService = new FinanceService();
