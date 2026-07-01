import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { faultService } from "@/lib/services/fault.service";
import { createTransferLogSchema } from "@/lib/validators";
import { parsePagination } from "@/lib/utils/pagination";
import { successResponse, createdResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: machineId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const pagination = parsePagination(req.nextUrl.searchParams);

    const { data, total } = await faultService.getTransferLogs(
      session?.user ?? null,
      machineId,
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

async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: machineId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    const validatedData = createTransferLogSchema.parse({ ...body, machineId });

    const log = await faultService.createTransferLog(session?.user ?? null, validatedData);
    return createdResponse(log);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const POST = withRateLimit("WRITE", postHandler);
