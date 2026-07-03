"use client";

import * as React from "react";

/**
 * Live camera QR scanner. Prefers the native BarcodeDetector API (fast, zero
 * bundle cost) and falls back to @zxing/browser where it's unavailable
 * (notably iOS Safari). Calls `onResult` once with the decoded text, then stops.
 */
export function QrScanner({
  onResult,
  onError,
  paused,
}: {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
  paused?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [status, setStatus] = React.useState<"starting" | "scanning" | "denied" | "error">(
    "starting"
  );
  const doneRef = React.useRef(false);
  const onResultRef = React.useRef(onResult);
  const onErrorRef = React.useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  React.useEffect(() => {
    if (paused) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;
    let cancelled = false;

    const finish = (text: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onResultRef.current(text);
    };

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setStatus("scanning");

        const BarcodeDetectorCtor = (
          window as unknown as { BarcodeDetector?: new (o?: unknown) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }
        ).BarcodeDetector;

        if (BarcodeDetectorCtor) {
          const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
          const tick = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const codes = await detector.detect(video);
              if (codes[0]?.rawValue) return finish(codes[0].rawValue);
            } catch {
              /* transient decode error — keep scanning */
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          // Fallback: @zxing/browser (dynamically imported so it never ships to
          // browsers that have BarcodeDetector).
          const { BrowserQRCodeReader } = await import("@zxing/browser");
          const reader = new BrowserQRCodeReader();
          zxingControls = await reader.decodeFromVideoElement(video, (result) => {
            if (result) finish(result.getText());
          });
        }
      } catch (e) {
        const err = e as DOMException;
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
          setStatus("denied");
          onErrorRef.current?.("Camera permission was denied.");
        } else {
          setStatus("error");
          onErrorRef.current?.("Could not access the camera.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [paused]);

  return (
    <div className="relative aspect-square w-full overflow-hidden border-2 border-teal-950/70 bg-black">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      {/* Reticle */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-2/3 w-2/3 border-2 border-teal-300/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
      </div>
      {status !== "scanning" && (
        <div className="absolute inset-0 flex items-center justify-center bg-teal-950/70 px-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-teal-100">
            {status === "starting" && "Starting camera…"}
            {status === "denied" && "Camera blocked. Enable it in your browser settings."}
            {status === "error" && "Camera unavailable on this device."}
          </p>
        </div>
      )}
    </div>
  );
}

/** Extract the machine qrToken from a scanned value (URL or raw token). */
export function extractQrToken(value: string): string {
  const v = value.trim();
  const match = v.match(/\/scan\/([^/?#\s]+)/);
  if (match) return match[1];
  try {
    const url = new URL(v);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("scan");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    /* not a URL — treat as raw token */
  }
  return v;
}
