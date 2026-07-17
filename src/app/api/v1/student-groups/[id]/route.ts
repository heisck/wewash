import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { studentGroupService } from "@/lib/services/student-group.service";
import { updateStudentGroupSchema } from "@/lib/validators";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

type Ctx = { params: Promise<{ id: string }> };

async function getHandler(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await auth.api.getSession({ headers: await headers() });
    const group = await studentGroupService.getById(session?.user ?? null, id);
    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    const validated = updateStudentGroupSchema.parse(body);
    const group = await studentGroupService.update(
      session?.user ?? null,
      id,
      validated
    );
    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await auth.api.getSession({ headers: await headers() });
    const result = await studentGroupService.softDelete(
      session?.user ?? null,
      id
    );
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const PATCH = withRateLimit("WRITE", patchHandler);
export const DELETE = withRateLimit("WRITE", deleteHandler);
