import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { hallService } from "@/lib/services/hall.service";
import { createRoomSchema } from "@/lib/validators";
import { successResponse, createdResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const rooms = await hallService.getRooms(session?.user ?? null, hallId);
    return successResponse(rooms);
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    
    // Inject hallId from path params into body for validator
    const validatedData = createRoomSchema.parse({ ...body, hallId });

    const room = await hallService.createRoom(session?.user ?? null, validatedData);
    return createdResponse(room);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const POST = withRateLimit("WRITE", postHandler);
