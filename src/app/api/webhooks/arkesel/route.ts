import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { env } from "@/lib/config/env";

const webhookLogger = logger.child({ service: "arkesel-webhook" });

/**
 * Arkesel delivery callbacks. Optional shared secret via
 * Authorization: Bearer <CRON_SECRET> or ?token= when set in prod.
 * Never echo internal errors to the provider.
 */
export async function POST(req: NextRequest) {
  try {
    if (env.NODE_ENV === "production" && env.CRON_SECRET) {
      const authHeader = req.headers.get("authorization");
      const token = req.nextUrl.searchParams.get("token");
      const ok =
        authHeader === `Bearer ${env.CRON_SECRET}` ||
        token === env.CRON_SECRET;
      if (!ok) {
        return NextResponse.json({ success: false }, { status: 401 });
      }
    }

    let body: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        body = Object.fromEntries(formData.entries()) as Record<string, unknown>;
      }
    }

    const messageId = String(body.id || body.message_id || "").slice(0, 128);
    const status = String(body.status || "").toLowerCase().slice(0, 32);

    if (!messageId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing callback fields" },
        { status: 400 }
      );
    }

    const logStatus =
      status === "delivered"
        ? "DELIVERED"
        : status === "failed" || status === "rejected"
          ? "FAILED"
          : "SENT";

    const updated = await prisma.notificationLog.updateMany({
      where: { providerId: messageId },
      data: {
        status: logStatus,
        deliveredAt: status === "delivered" ? new Date() : null,
      },
    });

    webhookLogger.info(
      { messageId, status, matchedRecords: updated.count },
      "Arkesel delivery status updated"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    webhookLogger.error({ err: error }, "Arkesel webhook processing failed");
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
