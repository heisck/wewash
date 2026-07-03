import { NextRequest } from "next/server";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { auth } from "@/lib/auth/config";
import { machineService } from "@/lib/services/machine.service";
import { env } from "@/lib/config/env";
import { handleApiError, AppError } from "@/lib/errors";

/**
 * GET /api/v1/machines/:id/qr — returns a PNG QR code that encodes the machine's
 * scan URL (`/scan/<qrToken>`). Admins print this and stick it on the machine;
 * students scan it to open the scan flow.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const qrToken = await machineService.ensureQrToken(session.user, id);
    const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const url = `${base}/scan/${qrToken}`;

    const png = await QRCode.toBuffer(url, {
      type: "png",
      width: 512,
      margin: 2,
      color: { dark: "#052b28", light: "#ffffff" },
    });

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="machine-${id}-qr.png"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
