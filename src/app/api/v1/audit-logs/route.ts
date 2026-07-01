import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { auditLogService } from "@/lib/services/audit-log.service";
import { parsePagination } from "@/lib/utils/pagination";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    
    const filters = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entity: searchParams.get("entity") || undefined,
      entityId: searchParams.get("entityId") || undefined,
    };

    const { data, total } = await auditLogService.getAuditLogs(
      session?.user ?? null,
      filters,
      pagination
    );

    return successResponse(data, 200, {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
