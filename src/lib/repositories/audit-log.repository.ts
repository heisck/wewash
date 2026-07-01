import { Prisma, AuditLog } from "@prisma/client";
import { BaseRepository, FindManyOptions } from "./base.repository";

export class AuditLogRepository extends BaseRepository {
  async findById(id: string): Promise<AuditLog | null> {
    return this.db.auditLog.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findMany(options: FindManyOptions): Promise<[AuditLog[], number]> {
    const { skip, take, orderBy, where, include } = options;

    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({ skip, take, orderBy, where, include }),
      this.db.auditLog.count({ where }),
    ]);

    return [items, total];
  }

  async create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    return this.db.auditLog.create({ data });
  }
}
