"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  PageTitle, PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { ContactConfig } from "@/lib/types/client";

export default function AdminSettingsPage() {
  const { data, reload } = useApi<ContactConfig>("/api/v1/system-config?group=contact");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultWeeklyAmount, setWeekly] = useState("");
  const [rotationHandoffTime, setHandoff] = useState("08:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWhatsapp(data.whatsapp ?? "");
    setEmail(data.email ?? "");
    setPhone(data.phone ?? "");
    setWeekly(
      data.defaultWeeklyAmount != null ? String(data.defaultWeeklyAmount) : ""
    );
    setHandoff(data.rotationHandoffTime || "08:00");
  }, [data]);

  // Also load public contact (getConfig returns rows; updateContact returns ContactConfig).
  // Prefer the dedicated public-shaped payload by reusing update response after first load.
  useEffect(() => {
    void (async () => {
      try {
        // Public contact endpoint path used elsewhere; fall back if shape differs
        const contact = await api.get<ContactConfig>("/api/v1/public/contact").catch(() => null);
        if (contact) {
          setWhatsapp(contact.whatsapp ?? "");
          setEmail(contact.email ?? "");
          setPhone(contact.phone ?? "");
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/api/v1/system-config", {
        whatsapp,
        email,
        phone,
        defaultWeeklyAmount: defaultWeeklyAmount ? Number(defaultWeeklyAmount) : 0,
        rotationHandoffTime,
      });
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
      <PageTitle text="SETTINGS" sub="System defaults controlled only by administrators" />

      <form onSubmit={save} className="space-y-6">
        <PixelCard className="space-y-4 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
            Contact (public)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="wa">WhatsApp</PixelLabel>
              <PixelInput id="wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="em">Email</PixelLabel>
              <PixelInput id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph">Phone</PixelLabel>
              <PixelInput id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save settings"}
        </PixelButton>
      </form>
    </div>
  );
}
