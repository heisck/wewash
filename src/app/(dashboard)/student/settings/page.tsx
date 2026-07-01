"use client";

import { useState } from "react";
import {
  Bell, Mail, MessageSquare, Moon, Sun,
  User, Phone, MapPin, Building
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage your profile and notification preferences.</p>
      </div>

      {/* Profile Card */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5">Profile Information</h2>

        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-blue-200">
            <AvatarImage src="https://github.com/shadcn.png" alt="@student" />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">JD</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">John Doe</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Student • Fall 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label="Full Name" value="John Doe" />
          <InfoRow icon={Mail} label="Email" value="john.doe@uni.edu.gh" />
          <InfoRow icon={Phone} label="Phone" value="+233 24 123 4567" />
          <InfoRow icon={MapPin} label="Room" value="Room 104" />
          <InfoRow icon={Building} label="Hall" value="Atlantic Hall, Floor 1" />
          <InfoRow icon={MessageSquare} label="Student ID" value="STU-2026-0104" />
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5">Notification Preferences</h2>

        <div className="space-y-4">
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
            desc="Browser push alerts for real-time updates"
            enabled={pushNotif}
            onToggle={() => setPushNotif(!pushNotif)}
          />
        </div>
      </Card>

      {/* Contract Info */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5">Contract Details</h2>

        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
            <Badge className="bg-green-50 text-green-600 dark:bg-green-950/30 text-[8px] rounded-full font-bold px-2 py-0.5 border border-green-200/20">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Period</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Oct 2026 – Feb 2027</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly Rate</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">GHS 35.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rotation Group</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Group 1 (7 rooms)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Machine</span>
            <span className="text-xs font-semibold text-[#2563eb]">WEWASH-W01-ATL</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon, title, desc, enabled, onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>; title: string; desc: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-xs border border-slate-200/50 dark:border-slate-700 shrink-0">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</p>
          <p className="text-[9px] text-slate-400 font-semibold">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${enabled ? "bg-[#2563eb]" : "bg-slate-200 dark:bg-slate-700"}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${enabled ? "ml-[22px]" : "ml-0.5"}`}
        />
      </button>
    </div>
  );
}
