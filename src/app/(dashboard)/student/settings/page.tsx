"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bell, Mail, MessageSquare, Camera, Building, ChevronDown,
} from "lucide-react";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelToggle,
} from "@/components/pixel/pixel-ui";
import { usePush } from "@/hooks/use-push";

export default function SettingsPage() {
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const { supported, subscribed, busy, subscribe, unsubscribe } = usePush();

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <PageTitle text="SETTINGS" sub="Profile, alerts & contract" />

      {/* ─── Profile banner ─── */}
      <PixelCard bolts className="overflow-hidden">
        {/* Cover: teal pixel gradient with checker texture */}
        <div className="bg-pixel-checker relative h-28 border-b-2 border-teal-900/25 bg-gradient-to-r from-teal-600 to-teal-800 dark:border-teal-100/20 sm:h-36">
          <button
            type="button"
            onClick={() => toast.info("Cover photo upload coming soon.")}
            aria-label="Change cover photo"
            className="absolute bottom-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-white/40 bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
          <div className="relative -mt-14 w-fit sm:-mt-16">
            <span className="flex h-20 w-20 items-center justify-center border-2 border-teal-950/70 bg-teal-400 text-xl font-black tracking-widest text-teal-950 shadow-pixel sm:h-24 sm:w-24 sm:text-2xl">
              JD
            </span>
            <button
              type="button"
              onClick={() => toast.info("Avatar upload coming soon.")}
              aria-label="Change avatar"
              className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center border-2 border-teal-950/70 bg-teal-600 text-white shadow-pixel-sm transition-colors hover:bg-teal-500"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-base font-black uppercase tracking-wider text-teal-950 dark:text-white">
              John Doe
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
              Room 104 - Atlantic Hall - STU-2026-0104
            </p>
          </div>
          <PixelButton size="sm" onClick={() => toast.success("Profile saved.")}>
            Save changes
          </PixelButton>
        </div>
      </PixelCard>

      {/* ─── Profile fields ─── */}
      <PixelCard className="divide-y-2 divide-teal-900/10 p-5 dark:divide-teal-100/10 sm:p-6">
        <FormRow label="Full name">
          <div className="flex w-full gap-3">
            <PixelInput defaultValue="John" className="flex-1" aria-label="First name" />
            <PixelInput defaultValue="Doe" className="flex-1" aria-label="Last name" />
          </div>
        </FormRow>

        <FormRow label="Email address">
          <PixelInput type="email" defaultValue="john.doe@uni.edu.gh" />
        </FormRow>

        <FormRow label="Phone number">
          <PixelInput type="tel" defaultValue="+233 24 123 4567" />
        </FormRow>

        <FormRow label="Room" sublabel="Assigned by hall management.">
          <PixelInput defaultValue="Room 104" disabled />
        </FormRow>

        <FormRow label="Hall">
          <PixelInput defaultValue="Atlantic Hall, Floor 1" disabled />
        </FormRow>

        <FormRow label="Student ID">
          <PixelInput defaultValue="STU-2026-0104" disabled />
        </FormRow>
      </PixelCard>

      {/* ─── Notification preferences ─── */}
      <PixelCard className="p-5 sm:p-6">
        <CollapsibleHeader
          icon={Bell}
          title="Notification preferences"
          sub="Manage how you receive alerts"
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
              desc="Receive rotation alerts & payment reminders via SMS"
              enabled={smsNotif}
              onToggle={() => setSmsNotif(!smsNotif)}
            />
            <ToggleRow
              icon={Mail}
              title="Email Notifications"
              desc="Get weekly summaries and receipts by email"
              enabled={emailNotif}
              onToggle={() => setEmailNotif(!emailNotif)}
            />
            <ToggleRow
              icon={Bell}
              title="Push Notifications"
              desc={
                !supported
                  ? "Install the PWA / use a supported browser with VAPID configured"
                  : subscribed
                    ? "On — early rotation alerts (paid students). SMS still fires ~2h before."
                    : "Off — enable for free app alerts when your machine day is coming"
              }
              enabled={subscribed}
              onToggle={async () => {
                if (busy) return;
                if (subscribed) {
                  await unsubscribe();
                  toast.success("Push notifications off on this device.");
                } else {
                  const ok = await subscribe();
                  if (ok) toast.success("Push notifications enabled.");
                  else toast.error("Could not enable push. Allow notifications when prompted.");
                }
              }}
            />
          </div>
        </div>
      </PixelCard>

      {/* ─── Contract details ─── */}
      <PixelCard className="p-5 sm:p-6">
        <CollapsibleHeader
          icon={Building}
          title="Contract details"
          sub="Your subscription & machine info"
          open={contractOpen}
          onToggle={() => setContractOpen(!contractOpen)}
        />
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            contractOpen ? "mt-5 max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3 border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15 dark:bg-teal-400/5">
            <ContractRow label="Status" value={<PixelBadge tone="green">Active</PixelBadge>} />
            <ContractRow label="Period" value="Oct 2026 – Feb 2027" />
            <ContractRow label="Weekly rate" value="GHS 35.00" bold />
            <ContractRow label="Rotation group" value="Group 1 (7 rooms)" />
            <ContractRow
              label="Machine"
              value={
                <span className="font-black text-teal-700 dark:text-teal-300">
                  WEWASH-W01-ATL
                </span>
              }
            />
          </div>
        </div>
      </PixelCard>
    </div>
  );
}

/* ─── Sub-components ─── */

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
