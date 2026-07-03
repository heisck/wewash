import { NextRequest } from "next/server";
import { z } from "zod";
import { systemConfigService } from "@/lib/services/system-config.service";
import { notificationService } from "@/lib/services/notification.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

/**
 * GET /api/v1/public/contact — public contact details (WhatsApp/email/phone),
 * admin-editable via SystemConfig with env fallbacks. Powers the contact page.
 */
async function getHandler(_req: NextRequest) {
  try {
    const contact = await systemConfigService.getContact();
    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

const leadSchema = z.object({
  name: z.string().min(1).max(80),
  contact: z.string().min(3).max(120), // phone or email
  message: z.string().min(1).max(500),
});

/** POST /api/v1/public/contact — a visitor's "reach out" message → notifies admins. */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const lead = leadSchema.parse(body);
    await notificationService.notifyAdmins(
      "New contact enquiry",
      `${lead.name} (${lead.contact}): ${lead.message}`,
      "/admin"
    );
    return successResponse({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const POST = withRateLimit("WRITE", postHandler);
