import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const webhookLogger = logger.child({ service: "arkesel-webhook" });

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        body = Object.fromEntries(formData.entries());
      }
    }

    webhookLogger.debug({ body }, "Received Arkesel callback webhook");

    const messageId = body.id || body.message_id;
    const status = body.status; // "delivered" | "failed" | "rejected"
    
    if (!messageId || !status) {
      return NextResponse.json({ success: false, error: "Missing callback fields" }, { status: 400 });
    }

    // Map Arkesel webhook status to NotificationLog status
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
      "Arkesel delivery log status updated successfully"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    webhookLogger.error({ error }, "Arkesel webhook processing failed");
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
