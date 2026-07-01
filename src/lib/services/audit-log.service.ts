import { AuditLog } from "@prisma/client";
import { AuditLogRepository } from "@/lib/repositories/audit-log.repository";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { PaginationInput, toSkipTake } from "@/lib/utils/pagination";

export class AuditLogService {
  private readonly repo: AuditLogRepository;

  constructor() {
    this.repo = new AuditLogRepository();
  }

  async getAuditLogs(
    user: User | null,
    filters: { userId?: string; action?: string; entity?: string; entityId?: string },
    pagination: PaginationInput
  ): Promise<{ data: AuditLog[]; total: number }> {
    requirePermission(user, "system_config", "read"); // Super admin / admin read config

    const { skip, take } = toSkipTake(pagination);
    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;

    const [data, total] = await this.repo.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    return { data, total };
  }

  async log(params: {
    userId: string | null;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string;
    userAgent?: string;
    metadata?: unknown;
  }): Promise<AuditLog> {
    return this.repo.create({
      userId: params.userId || undefined,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValues: params.oldValues as any,
      newValues: params.newValues as any,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata as any,
    });
  }
}

export const auditLogService = new AuditLogService();
