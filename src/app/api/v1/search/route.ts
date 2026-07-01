import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { searchService } from "@/lib/services/search.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const query = req.nextUrl.searchParams.get("q") || "";

    const results = await searchService.globalSearch(session?.user ?? null, query);
    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
