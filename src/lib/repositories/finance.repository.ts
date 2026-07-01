import { Prisma, Contract, Payment } from "@prisma/client";
import { BaseRepository, FindManyOptions } from "./base.repository";

export class FinanceRepository extends BaseRepository {
  // ─── Contract Operations ─────────────────────────────────────

  async findContractById(id: string): Promise<Contract | null> {
    return this.db.contract.findFirst({
      where: { id, deletedAt: null },
      include: { student: true, machine: true },
    });
  }

  async findManyContracts(options: FindManyOptions): Promise<[Contract[], number]> {
    const { skip, take, orderBy, where, include } = options;
    const baseWhere: Prisma.ContractWhereInput = {
      deletedAt: null,
      ...where,
    };

    const [items, total] = await Promise.all([
      this.db.contract.findMany({ skip, take, orderBy, where: baseWhere, include }),
      this.db.contract.count({ where: baseWhere }),
    ]);

    return [items, total];
  }

  async createContract(data: Prisma.ContractCreateInput): Promise<Contract> {
    return this.db.contract.create({ data });
  }

  async updateContract(id: string, data: Prisma.ContractUpdateInput): Promise<Contract> {
    return this.db.contract.update({ where: { id }, data });
  }

  async deleteContract(id: string): Promise<Contract> {
    return this.db.contract.update({
      where: { id },
      data: { deletedAt: new Date(), status: "TERMINATED" },
    });
  }

  // ─── Payment Operations ──────────────────────────────────────

  async findPaymentById(id: string): Promise<Payment | null> {
    return this.db.payment.findFirst({
      where: { id, deletedAt: null },
      include: { student: true, contract: true },
    });
  }

  async findPaymentByReference(reference: string): Promise<Payment | null> {
    return this.db.payment.findFirst({
      where: { reference, deletedAt: null },
    });
  }

  async findManyPayments(options: FindManyOptions): Promise<[Payment[], number]> {
    const { skip, take, orderBy, where, include } = options;
    const baseWhere: Prisma.PaymentWhereInput = {
      deletedAt: null,
      ...where,
    };

    const [items, total] = await Promise.all([
      this.db.payment.findMany({ skip, take, orderBy, where: baseWhere, include }),
      this.db.payment.count({ where: baseWhere }),
    ]);

    return [items, total];
  }

  async createPayment(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.db.payment.create({ data });
  }

  async updatePayment(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.db.payment.update({ where: { id }, data });
  }

  async deletePayment(id: string): Promise<Payment> {
    return this.db.payment.update({
      where: { id },
      data: { deletedAt: new Date(), status: "CANCELLED" },
    });
  }
}
