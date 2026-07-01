import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { hallService } from "@/lib/services/hall.service";
import { updateHallSchema } from "@/lib/validators";
import { successResponse, noContentResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const hall = await hallService.getHallById(session?.user ?? null, id);
    return successResponse(hall);
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    const validatedData = updateHallSchema.parse(body);

    const hall = await hallService.updateHall(session?.user ?? null, id, validatedData);
    return successResponse(hall);
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    await hallService.deleteHall(session?.user ?? null, id);
    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const PATCH = withRateLimit("WRITE", patchHandler);
export const DELETE = withRateLimit("WRITE", deleteHandler);
