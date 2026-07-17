"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      await navigator.serviceWorker.ready;
      return existing;
    }
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

/**
 * Manages this device's Web Push subscription.
 * `supported` is false when the browser lacks push APIs or VAPID isn't configured.
 */
export function usePush() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY;

  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void (async () => {
      const reg = await ensureServiceWorker();
      if (cancelled || !reg) return;
      try {
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(!!sub);
      } catch {
        /* ignore */
      }
      if (!cancelled && "Notification" in window) {
        setPermission(Notification.permission);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!VAPID_PUBLIC_KEY) {
      return {
        ok: false,
        error: "Push is not configured (missing VAPID public key).",
      };
    }
    if (!supported) {
      return {
        ok: false,
        error: "This browser does not support push notifications.",
      };
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        return {
          ok: false,
          error:
            perm === "denied"
              ? "Notifications are blocked. Enable them in browser settings."
              : "Notification permission was not granted.",
        };
      }

      const reg = await ensureServiceWorker();
      if (!reg) {
        return { ok: false, error: "Could not register the service worker." };
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        return { ok: false, error: "Push subscription keys incomplete." };
      }

      await api.post("/api/v1/push/subscribe", {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setSubscribed(true);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not enable push.";
      return { ok: false, error: msg };
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) return { ok: true };
    setBusy(true);
    try {
      const reg = await ensureServiceWorker();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await api
          .del("/api/v1/push/subscribe", { endpoint: sub.endpoint })
          .catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Could not disable push.",
      };
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return {
    supported,
    subscribed,
    busy,
    permission,
    vapidConfigured: !!VAPID_PUBLIC_KEY,
    subscribe,
    unsubscribe,
  };
}
