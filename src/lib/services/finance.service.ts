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
import { startOfBillingWeek, rotationDayPassed } from "@/lib/utils/week";
import {
  money,
  remainingDues,
  isPaidInFull,
  sumCompletedPaidThisWeek,
  getStudentWeekDues,
} from "./weekly-dues";
import { auditLogService } from "./audit-log.service";
import { notificationService } from "./notification.service";
import type { DayOfWeek } from "@prisma/client";

export class FinanceService {
  private readonly repo: FinanceRepository;
  private readonly studentRepo: StudentRepository;
  private readonly machineRepo: MachineRepository;

  constructor() {
    this.repo = new FinanceRepository();
    this.studentRepo = new StudentRepository();
    this.machineRepo = new MachineRepository();
  }

  private async getStudentIdForUser(user: User | null): Promise<string | undefined> {
    if (!user) return undefined;
    // Admins don't have personal dues; students may need email→profile auto-link
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return undefined;

    let student = await this.studentRepo.findByUserId(user.id);
    if (!student) {
      const { studentService } = await import("./student.service");
      const linked = await studentService.ensureStudentLinkedToUser(user);
      if (linked) student = await this.studentRepo.findByUserId(user.id);
    }
    return student?.id;
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

  /**
   * Admin review board: pending student proofs (verify amount) + students still
   * short of this week's assigned fee (partials allowed until sum >= weeklyAmount).
   */
  async getReviewBoard(user: User | null) {
    requirePermission(user, "payments", "read");
    if (user?.role === "STUDENT") {
      throw AppError.forbidden("Admins only");
    }

    const weekStart = startOfBillingWeek();
    const { prisma } = await import("@/lib/db/prisma");

    const [pendingProofs, students] = await Promise.all([
      this.repo.findManyPayments({
        take: 100,
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          student: { include: { room: { include: { hall: true } }, group: true } },
        },
      }),
      prisma.student.findMany({
        where: { deletedAt: null, isActive: true, weeklyAmount: { gt: 0 } },
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          weeklyAmount: true,
          roomNumber: true,
          userId: true,
          groupId: true,
          group: {
            select: {
              id: true,
              name: true,
              hallId: true,
              floor: true,
              block: true,
              hall: { select: { id: true, code: true, name: true } },
            },
          },
          room: {
            select: {
              id: true,
              number: true,
              hallId: true,
              hall: { select: { id: true, code: true, name: true } },
              machineSchedules: {
                where: { isActive: true },
                select: { dayOfWeek: true },
              },
            },
          },
        },
        orderBy: [{ roomNumber: "asc" }, { lastName: "asc" }],
      }),
    ]);

    // Sum all COMPLETED pieces this week (not just "has any payment")
    const paidMap = await sumCompletedPaidThisWeek(students.map((s) => s.id));

    let paidInFullCount = 0;
    const notFullyPaid = students
      .map((s) => {
        const weeklyAmount = money(s.weeklyAmount);
        const paidThisWeek = paidMap.get(s.id) ?? 0;
        const full = isPaidInFull(paidThisWeek, weeklyAmount);
        if (full) paidInFullCount += 1;
        const days = (s.room?.machineSchedules ?? []).map((ms) => ms.dayOfWeek as DayOfWeek);
        return {
          ...s,
          weeklyAmount,
          paidThisWeek,
          remaining: remainingDues(paidThisWeek, weeklyAmount),
          isPaidInFull: full,
          rotationDayPassed: rotationDayPassed(days),
          scheduleDays: days,
        };
      })
      .filter((s) => !s.isPaidInFull)
      .sort((a, b) => {
        const ra = a.room?.number ?? a.roomNumber ?? "zzz";
        const rb = b.room?.number ?? b.roomNumber ?? "zzz";
        return String(ra).localeCompare(String(rb), undefined, { numeric: true });
      });

    const [pendingList] = pendingProofs;
    const sortedPending = [...pendingList].sort((a, b) => {
      const ra =
        (a as { student?: { room?: { number?: string }; roomNumber?: string } }).student?.room
          ?.number ??
        (a as { student?: { roomNumber?: string } }).student?.roomNumber ??
        "";
      const rb =
        (b as { student?: { room?: { number?: string } } }).student?.room?.number ??
        (b as { student?: { roomNumber?: string } }).student?.roomNumber ??
        "";
      const t = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (t !== 0) return t;
      return String(ra).localeCompare(String(rb), undefined, { numeric: true });
    });

    return {
      weekStart: weekStart.toISOString(),
      pendingProofs: sortedPending,
      unpaidThisWeek: notFullyPaid,
      counts: {
        pending: sortedPending.length,
        unpaid: notFullyPaid.length,
        paid: paidInFullCount,
      },
    };
  }

  /**
   * Student: this week's dues progress (pieces + full status).
   * Returns null when the login has no linked student profile (no 404 noise).
   */
  async getMyWeekDues(user: User | null) {
    if (!user) throw AppError.unauthorized();
    const studentId = await this.getStudentIdForUser(user);
    if (!studentId) return null;
    const student = await this.studentRepo.findById(studentId);
    if (!student) return null;
    return getStudentWeekDues(studentId, money(student.weeklyAmount));
  }

  async getPayments(
    user: User | null,
    filters: { studentId?: string; contractId?: string; status?: any; method?: any },
    pagination: PaginationInput
  ): Promise<{ data: Payment[]; total: number }> {
    requirePermission(user, "payments", "read");
    const { skip, take } = toSkipTake(pagination);
    const where: Prisma.PaymentWhereInput = {};

    const ownStudentId = await this.getStudentIdForUser(user);
    if (ownStudentId) {
      where.studentId = ownStudentId;
    } else if (filters.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters.contractId) where.contractId = filters.contractId;
    if (filters.status) where.status = filters.status;
    if (filters.method) where.method = filters.method;

    const [data, total] = await this.repo.findManyPayments({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { room: { include: { hall: true } } } },
        contract: true,
      },
    });

    return { data, total };
  }

  async getPaymentById(user: User | null, id: string): Promise<Payment> {
    requirePermission(user, "payments", "read");
    const payment = await this.repo.findPaymentById(id);
    if (!payment) throw AppError.notFound("Payment", id);

    const ownStudentId = await this.getStudentIdForUser(user);
    if (ownStudentId && payment.studentId !== ownStudentId) {
      throw AppError.forbidden("You can only view your own payments.");
    }
    return payment;
  }

  /**
   * Admin records a payment, or a student submits off-app proof (screenshot +
   * amount) as PENDING for admin confirmation.
   */
  async createPayment(user: User | null, data: CreatePaymentInput): Promise<Payment> {
    requirePermission(user, "payments", "create");

    const isStudent = user?.role === "STUDENT";
    let studentId: string;

    if (isStudent) {
      const ownId = await this.getStudentIdForUser(user);
      if (!ownId) throw AppError.forbidden("Student profile required");
      studentId = ownId;
      if (!data.receiptUrl) {
        throw AppError.badRequest("Attach a payment screenshot (receipt URL) before submitting.");
      }
      const claimed = data.amountPaid ?? data.amount ?? 0;
      if (claimed <= 0) {
        throw AppError.badRequest("Enter the amount you paid.");
      }
    } else {
      if (!data.studentId) {
        throw AppError.badRequest("Student is required");
      }
      studentId = data.studentId;
    }

    const student = await this.studentRepo.findById(studentId);
    if (!student) throw AppError.notFound("Student", studentId);

    if (data.contractId) {
      const contract = await this.repo.findContractById(data.contractId);
      if (!contract) throw AppError.notFound("Contract", data.contractId);
    }

    if (data.reference) {
      const existing = await this.repo.findPaymentByReference(data.reference);
      if (existing) throw AppError.conflict("Payment reference already exists");
    }

    const amountPaid = data.amountPaid ?? data.amount ?? 0;
    const amountDue =
      data.amountDue ??
      (isStudent ? Number(student.weeklyAmount ?? amountPaid) : amountPaid);
    if (!amountPaid && !amountDue) {
      throw AppError.badRequest("Amount due or amount paid is required");
    }

    // Students always land PENDING until admin confirms.
    // Admins: derive paid / partial / completed unless status is set.
    let status = data.status ?? (isStudent ? "PENDING" : "COMPLETED");
    if (isStudent) {
      status = "PENDING";
    } else if (!data.status) {
      if (amountPaid <= 0) status = "PENDING";
      else if (amountDue > 0 && amountPaid < amountDue) status = "PENDING";
      else status = "COMPLETED";
    }

    const payment = await this.repo.createPayment({
      student: { connect: { id: studentId } },
      contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
      amount: new Prisma.Decimal(amountPaid || amountDue),
      amountDue: new Prisma.Decimal(amountDue),
      amountPaid: new Prisma.Decimal(amountPaid),
      currency: data.currency ?? "GHS",
      method: data.method,
      reference: data.reference,
      momoTransactionId: data.momoTransactionId,
      description:
        data.description ??
        (isStudent
          ? `Off-app payment proof from ${student.firstName} ${student.lastName}`
          : undefined),
      dueDate: data.dueDate,
      paidAt: isStudent
        ? undefined
        : data.paidAt || (status === "COMPLETED" && amountPaid > 0 ? new Date() : undefined),
      receiptUrl: data.receiptUrl || undefined,
      notes: data.notes,
      status,
      recordedBy: isStudent ? null : (user?.id ?? null),
    });

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "CREATE",
      entity: "Payment",
      entityId: payment.id,
      newValues: payment,
    });

    if (isStudent && status === "PENDING") {
      void notificationService.notifyAdmins(
        "Payment proof submitted",
        `${student.firstName} ${student.lastName} claims GHS ${amountPaid}. Review screenshot and confirm.`,
        "/admin/payments"
      );
    } else if (!isStudent && status === "COMPLETED") {
      void notificationService.notify({
        userIds: student.userId ? [student.userId] : [],
        phones: [student.phone],
        title: "Payment confirmed",
        body: `We received your payment of GHS ${amountPaid}. Thank you! - WeWash`,
        url: "/student/billing",
      });
    }

    return payment;
  }

  async updatePayment(user: User | null, id: string, data: UpdatePaymentInput): Promise<Payment> {
    requirePermission(user, "payments", "update");

    const payment = await this.repo.findPaymentById(id);
    if (!payment) throw AppError.notFound("Payment", id);

    const wasCompleted = payment.status === "COMPLETED";
    const updateData: Prisma.PaymentUpdateInput = {};
    if (data.status) updateData.status = data.status;
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.amountDue !== undefined) updateData.amountDue = new Prisma.Decimal(data.amountDue);
    if (data.amountPaid !== undefined) {
      updateData.amountPaid = new Prisma.Decimal(data.amountPaid);
      updateData.amount = new Prisma.Decimal(data.amountPaid);
    }
    if (data.method) updateData.method = data.method;
    if (data.reference) updateData.reference = data.reference;
    if (data.momoTransactionId !== undefined) updateData.momoTransactionId = data.momoTransactionId;
    if (data.description) updateData.description = data.description;
    if (data.dueDate) updateData.dueDate = data.dueDate;
    if (data.paidAt) updateData.paidAt = data.paidAt;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl || null;
    if (data.notes) updateData.notes = data.notes;

    // Confirming a pending proof: stamp paidAt if missing
    if (data.status === "COMPLETED" && !wasCompleted && !data.paidAt && !payment.paidAt) {
      updateData.paidAt = new Date();
    }
    if (data.status === "COMPLETED" && user?.id) {
      updateData.recordedBy = user.id;
    }

    const updated = await this.repo.updatePayment(id, updateData);

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "Payment",
      entityId: id,
      oldValues: payment,
      newValues: updated,
    });

    if (data.status === "COMPLETED" && !wasCompleted) {
      const student = await this.studentRepo.findById(payment.studentId);
      if (student) {
        const paid = Number(updated.amountPaid ?? updated.amount ?? 0);
        void notificationService.notify({
          userIds: student.userId ? [student.userId] : [],
          phones: [student.phone],
          title: "Payment confirmed",
          body: `Your payment of GHS ${paid} was verified. Thank you! - WeWash`,
          url: "/student/billing",
        });
      }
    } else if (data.status === "FAILED" || data.status === "CANCELLED") {
      const student = await this.studentRepo.findById(payment.studentId);
      if (student) {
        void notificationService.notify({
          userIds: student.userId ? [student.userId] : [],
          phones: [student.phone],
          title: "Payment not verified",
          body: `We could not verify your recent payment proof. Please contact WeWash admin or resubmit. - WeWash`,
          url: "/student/billing",
        });
      }
    }

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
