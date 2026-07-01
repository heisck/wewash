import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { financeService } from "@/lib/services/finance.service";
import { createContractSchema } from "@/lib/validators";
import { parsePagination } from "@/lib/utils/pagination";
import { successResponse, createdResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const filters = {
      studentId: searchParams.get("studentId") || undefined,
      machineId: searchParams.get("machineId") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const { data, total } = await financeService.getContracts(
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

async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    const validatedData = createContractSchema.parse(body);

    const contract = await financeService.createContract(session?.user ?? null, validatedData);
    return createdResponse(contract);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const POST = withRateLimit("WRITE", postHandler);
