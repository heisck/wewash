"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, UserRound } from "lucide-react";
import {
  PageTitle, PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/client";
import type { ContactConfig, MeResponse } from "@/lib/types/client";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as
    | { name?: string | null; email?: string | null }
    | undefined;

  const { data, reload } = useApi<ContactConfig>("/api/v1/system-config?group=contact");
  const { data: me, reload: reloadMe } = useApi<MeResponse>("/api/v1/me");

  const [displayName, setDisplayName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [defaultWeeklyAmount, setWeekly] = useState("");
  const [rotationHandoffTime, setHandoff] = useState("08:00");
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Prefer /api/v1/me (DB), fall back to Better Auth session so fields aren't blank.
  useEffect(() => {
    const name = me?.user?.name || sessionUser?.name || "";
    const email = me?.user?.email || sessionUser?.email || "";
    if (name) setDisplayName(name);
    if (email) setLoginEmail(email);
  }, [me, sessionUser?.name, sessionUser?.email]);

  useEffect(() => {
    if (!data || Array.isArray(data)) return;
    setContactWhatsapp(data.whatsapp ?? "");
    setContactEmail(data.email ?? "");
    setContactPhone(data.phone ?? "");
    setWeekly(
      data.defaultWeeklyAmount != null && data.defaultWeeklyAmount !== undefined
        ? String(data.defaultWeeklyAmount)
        : ""
    );
    setHandoff(data.rotationHandoffTime || "08:00");
  }, [data]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      toast.error("Enter your display name.");
      return;
    }
    setSavingName(true);
    try {
      await api.patch("/api/v1/me", { name });
      toast.success("Your name was updated.");
      reloadMe();
      window.setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      toast.error((err as ApiError).message || "Could not save your name.");
    } finally {
      setSavingName(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.put<ContactConfig>("/api/v1/system-config", {
        whatsapp: contactWhatsapp,
        email: contactEmail,
        phone: contactPhone,
        defaultWeeklyAmount: defaultWeeklyAmount === "" ? 0 : Number(defaultWeeklyAmount),
        rotationHandoffTime,
      });
      setContactWhatsapp(saved.whatsapp ?? "");
      setContactEmail(saved.email ?? "");
      setContactPhone(saved.phone ?? "");
      setWeekly(
        saved.defaultWeeklyAmount != null ? String(saved.defaultWeeklyAmount) : ""
      );
      setHandoff(saved.rotationHandoffTime || "08:00");
      toast.success("Settings saved.");
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle text="SETTINGS" sub="Your profile and system defaults" />

      <form onSubmit={saveProfile} className="space-y-4">
        <PixelCard className="space-y-4 p-5">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
            <UserRound className="h-3.5 w-3.5" />
            Your profile
          </p>
          <p className="text-xs text-teal-900/55 dark:text-teal-100/55">
            Display name appears in the admin bar. Login email is your sign-in address (read-only).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="displayName">Display name</PixelLabel>
              <PixelInput
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kwame Mensah"
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="loginEmail">Login email</PixelLabel>
              <PixelInput
                id="loginEmail"
                type="email"
                value={loginEmail}
                disabled
                readOnly
                placeholder="Loading…"
              />
            </div>
          </div>
          <PixelButton type="submit" disabled={savingName}>
            <Save className="h-3.5 w-3.5" />
            {savingName ? "Saving…" : "Save my name"}
          </PixelButton>
        </PixelCard>
      </form>

      <form onSubmit={save} className="space-y-6">
        <PixelCard className="space-y-4 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
            Contact (public)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="wa">WhatsApp</PixelLabel>
              <PixelInput
                id="wa"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="em">Public email</PixelLabel>
              <PixelInput
                id="em"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph">Phone</PixelLabel>
              <PixelInput
                id="ph"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </PixelCard>

        <PixelCard className="space-y-4 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
            Subscription defaults
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="weekly">Default weekly fee (GHS)</PixelLabel>
              <PixelInput
                id="weekly"
                type="number"
                step="0.01"
                min={0}
                value={defaultWeeklyAmount}
                onChange={(e) => setWeekly(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="handoff">Default handoff time</PixelLabel>
              <PixelInput
                id="handoff"
                type="time"
                value={rotationHandoffTime}
                onChange={(e) => setHandoff(e.target.value)}
              />
            </div>
          </div>
        </PixelCard>

        <PixelButton type="submit" disabled={saving}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save system settings"}
        </PixelButton>
      </form>
    </div>
  );
}
