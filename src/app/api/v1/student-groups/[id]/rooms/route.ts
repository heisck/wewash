import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { studentGroupService } from "@/lib/services/student-group.service";
import { createdResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  roomNumber: z.string().min(1).max(32),
});

/**
 * POST /api/v1/student-groups/:id/rooms
 * Upsert a room under the group's hostel/block (for rotation). Does not
 * touch machine schedules — assign wash days on the Rotation page.
 */
async function postHandler(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    const { roomNumber } = bodySchema.parse(body);
    const room = await studentGroupService.addRoom(
      session?.user ?? null,
      id,
      roomNumber
    );
    return createdResponse(room);
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("WRITE", postHandler);
