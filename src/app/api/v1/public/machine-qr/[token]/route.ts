import { NextRequest } from "next/server";
import { scanService } from "@/lib/services/scan.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

/**
 * GET /api/v1/public/machine-qr/:token
 * Public machine label for a printed QR — so the scan page can show which
 * machine you are about to claim before/after login.
 */
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const machine = await scanService.peekMachine(token);
    return successResponse(machine);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
