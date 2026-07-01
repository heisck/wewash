import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { machineService } from "@/lib/services/machine.service";
import { updateMachineSchema, bulkMachineScheduleSchema } from "@/lib/validators";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    
    const machine = await machineService.getMachineDetails(session?.user ?? null, id);
    return successResponse(machine);
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
    
    const validatedData = updateMachineSchema.parse(body);
    const machine = await machineService.updateMachine(
      session?.user ?? null,
      id,
      validatedData
    );

    return successResponse(machine);
  } catch (error) {
    return handleApiError(error);
  }
}

async function putHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    
    const validatedData = bulkMachineScheduleSchema.parse({ ...body, machineId: id });
    await machineService.replaceSchedule(session?.user ?? null, validatedData);

    // Return the updated machine details with schedule
    const updated = await machineService.getMachineDetails(session?.user ?? null, id);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const PATCH = withRateLimit("WRITE", patchHandler);
export const PUT = withRateLimit("WRITE", putHandler); // Used for updating schedule
