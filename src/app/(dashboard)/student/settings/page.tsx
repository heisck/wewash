"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Bell, Mail, MessageSquare, Building, ChevronDown, CreditCard,
} from "lucide-react";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelToggle,
} from "@/components/pixel/pixel-ui";
import { usePush } from "@/hooks/use-push";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { MeResponse, WeekDuesStatus } from "@/lib/types/client";

export default function SettingsPage() {
  const { data: me, reload, loading: meLoading } = useApi<MeResponse>("/api/v1/me");
  const { data: dues } = useApi<WeekDuesStatus>(
    me?.student ? "/api/v1/me/dues" : null
  );
  const [notifOpen, setNotifOpen] = useState(true);
  const [contractOpen, setContractOpen] = useState(false);
  const {
    supported,
    subscribed,
    busy,
    permission,
    vapidConfigured,
    subscribe,
    unsubscribe,
  } = usePush();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    if (me.student) {
      setFirstName(me.student.firstName);
      setLastName(me.student.lastName);
      setPhone(me.student.phone || me.user.phone || "");
    } else {
      const parts = (me.user.name || "").split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(me.user.phone || "");
    }
    setSmsNotif(me.user.notifySms !== false);
    setEmailNotif(!!me.user.notifyEmail);
  }, [me]);

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "??";
  const roomLabel = me?.student?.room?.number
    ? `Room ${me.student.room.number}`
    : me?.student?.roomNumber
      ? `Room ${me.student.roomNumber}`
      : "No room";
  const hallLabel =
    me?.student?.room?.hall?.name ||
    me?.student?.group?.hall?.name ||
    "";
  const groupLabel = me?.student?.group
    ? `${me.student.group.name} · Fl. ${me.student.group.floor} · Bl. ${me.student.group.block}`
    : "—";
  const weekly = Number(me?.student?.weeklyAmount ?? 0);
  const paidWeek = dues?.paidThisWeek ?? 0;
  const remaining = dues?.remaining ?? 0;
  const paidFull = dues?.isPaidInFull ?? weekly <= 0;

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/api/v1/me", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        notifySms: smsNotif,
        notifyEmail: emailNotif,
      });
      toast.success("Settings saved.");
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const savePref = async (patch: { notifySms?: boolean; notifyEmail?: boolean }) => {
    try {
      await api.patch("/api/v1/me", patch);
      if (patch.notifySms !== undefined) setSmsNotif(patch.notifySms);
      if (patch.notifyEmail !== undefined) setEmailNotif(patch.notifyEmail);
      toast.success("Preference saved.");
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not update preference.");
    }
  };

  if (meLoading && !me) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <PageTitle text="SETTINGS" sub="Profile, alerts & weekly subscription" />

      <PixelCard bolts className="overflow-hidden">
        <div className="bg-pixel-checker relative h-28 border-b-2 border-teal-900/25 bg-gradient-to-r from-teal-600 to-teal-800 dark:border-teal-100/20 sm:h-36" />

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
          <div className="relative -mt-14 w-fit sm:-mt-16">
            <span className="flex h-20 w-20 items-center justify-center border-2 border-teal-950/70 bg-teal-400 text-xl font-black tracking-widest text-teal-950 shadow-pixel sm:h-24 sm:w-24 sm:text-2xl">
              {initials}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-base font-black uppercase tracking-wider text-teal-950 dark:text-white">
              {firstName} {lastName}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
              {roomLabel}
              {hallLabel ? ` · ${hallLabel}` : ""}
              {me?.student?.studentId ? ` · ${me.student.studentId}` : ""}
            </p>
          </div>
          <PixelButton size="sm" onClick={saveProfile} disabled={saving || !me?.student}>
            {saving ? "Saving…" : "Save changes"}
          </PixelButton>
        </div>
      </PixelCard>

      {!me?.student && (
        <PixelCard className="border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-[12px] font-semibold text-amber-950 dark:text-amber-100">
            No student profile is linked to this login. Ask admin to register you
            with <strong>{me?.user.email}</strong>.
          </p>
        </PixelCard>
      )}

      <PixelCard className="divide-y-2 divide-teal-900/10 p-5 dark:divide-teal-100/10 sm:p-6">
        <FormRow label="Full name">
          <div className="flex w-full gap-3">
            <PixelInput
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1"
              aria-label="First name"
            />
            <PixelInput
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="flex-1"
              aria-label="Last name"
            />
          </div>
        </FormRow>

        <FormRow label="Email address" sublabel="Login email — contact admin to change.">
          <PixelInput type="email" value={me?.user.email ?? ""} disabled />
        </FormRow>

        <FormRow label="Phone number">
          <PixelInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormRow>

        <FormRow label="Room" sublabel="Assigned by hall management.">
          <PixelInput value={roomLabel} disabled />
        </FormRow>

        <FormRow label="Group">
          <PixelInput value={groupLabel} disabled />
        </FormRow>

        <FormRow label="Hall">
          <PixelInput value={hallLabel || "—"} disabled />
        </FormRow>

        <FormRow label="Student ID">
          <PixelInput value={me?.student?.studentId ?? "—"} disabled />
        </FormRow>
      </PixelCard>

      <PixelCard className="p-5 sm:p-6">
        <CollapsibleHeader
          icon={Bell}
          title="Notification preferences"
          sub="Saved to your account"
          open={notifOpen}
          onToggle={() => setNotifOpen(!notifOpen)}
        />
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            notifOpen ? "mt-5 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3">
            <ToggleRow
              icon={MessageSquare}
              title="SMS Notifications"
              desc="Weekly pay SMS (Friday) and critical machine SMS (~2h). Stored in DB."
              enabled={smsNotif}
              onToggle={() => void savePref({ notifySms: !smsNotif })}
            />
            <ToggleRow
              icon={Mail}
              title="Email Notifications"
              desc="Opt-in for future email digests (stored; email channel not fully wired yet)."
              enabled={emailNotif}
              onToggle={() => void savePref({ notifyEmail: !emailNotif })}
            />
            <ToggleRow
              icon={Bell}
              title="Push Notifications"
              desc={
                !vapidConfigured
                  ? "Server push keys not configured yet"
                  : !supported
                    ? "Use Chrome/Edge/Safari (PWA) with notification support"
                    : permission === "denied"
                      ? "Blocked in browser settings — allow notifications for this site"
                      : subscribed
                        ? "On this device — rotation + pay nudges when eligible"
                        : "Off — enable for free app alerts (rotation 24/12/6h when paid)"
              }
              enabled={subscribed}
              onToggle={async () => {
                if (busy) return;
                if (subscribed) {
                  const res = await unsubscribe();
                  if (res.ok) toast.success("Push off on this device.");
                  else toast.error(res.error || "Could not disable push.");
                } else {
                  const res = await subscribe();
                  if (res.ok) toast.success("Push enabled on this device.");
                  else toast.error(res.error || "Allow notifications when prompted.");
                }
              }}
            />
            {subscribed && (
              <p className="px-1 text-[9px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                This device will receive in-app rotation alerts
              </p>
            )}
          </div>
        </div>
      </PixelCard>

      <PixelCard className="p-5 sm:p-6">
        <CollapsibleHeader
          icon={Building}
          title="Subscription"
          sub="Weekly fee & room"
          open={contractOpen}
          onToggle={() => setContractOpen(!contractOpen)}
        />
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            contractOpen ? "mt-5 max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3 border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15 dark:bg-teal-400/5">
            <ContractRow
              label="Status"
              value={
                <PixelBadge tone={me?.student?.isActive !== false ? "green" : "slate"}>
                  {me?.student?.isActive !== false ? "Active" : "Inactive"}
                </PixelBadge>
              }
            />
            <ContractRow
              label="Weekly rate"
              value={`GHS ${weekly.toFixed(2)}`}
              bold
            />
            <ContractRow
              label="This week"
              value={
                paidFull
                  ? `Paid in full (${paidWeek.toFixed(2)})`
                  : `GHS ${remaining.toFixed(2)} remaining`
              }
            />
            <ContractRow label="Room" value={roomLabel} />
            <ContractRow label="Group" value={groupLabel} />
            <ContractRow label="Hall" value={hallLabel || "—"} />
            <div className="pt-2">
              <Link href="/student/billing">
                <PixelButton size="sm" variant="outline" type="button">
                  <CreditCard className="h-3.5 w-3.5" /> Open payments
                </PixelButton>
              </Link>
            </div>
          </div>
        </div>
      </PixelCard>
    </div>
  );
}

function FormRow({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-8">
      <div className="shrink-0 sm:w-44">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
          {label}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-[9px] font-semibold text-teal-900/40 dark:text-teal-100/40">
            {sublabel}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function CollapsibleHeader({
  icon: Icon,
  title,
  sub,
  open,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-white">
            {title}
          </h2>
          <p className="text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">{sub}</p>
        </div>
      </div>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-teal-900/50 transition-transform duration-200 dark:text-teal-100/50 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function ContractRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[9px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
        {label}
      </span>
      <span
        className={`text-xs ${
          bold
            ? "font-black text-teal-950 dark:text-white"
            : "font-bold text-teal-900/80 dark:text-teal-100/80"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  enabled,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void | Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15 dark:bg-teal-400/5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-white text-teal-700 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-300">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-teal-950 dark:text-teal-50">
            {title}
          </p>
          <p className="text-[9px] font-semibold text-teal-900/50 dark:text-teal-100/50">{desc}</p>
        </div>
      </div>
      <PixelToggle enabled={enabled} onToggle={onToggle} label={title} />
    </div>
  );
}
