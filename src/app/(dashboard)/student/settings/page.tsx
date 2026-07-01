"use client";

import { useState } from "react";
import {
  Bell, Mail, MessageSquare, Camera,
  User, Phone, MapPin, Building, ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-0">

      {/* Banner + Profile Header */}
      <Card className="rounded-none sm:rounded-t-none border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden -mx-6 sm:-mx-8 md:mx-0 md:rounded-b-3xl">
        {/* Cover Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
          <button className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer border border-white/20">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 -mt-10 sm:-mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white dark:border-slate-900 shadow-lg">
                <AvatarImage src="https://github.com/shadcn.png" alt="@student" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-2xl">JD</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 cursor-pointer hover:bg-[#1d4ed8] transition-colors">
                <Camera className="h-3 w-3" />
              </button>
            </div>

            {/* Name + Actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 sm:pt-0 sm:pb-1">
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white">Profile</h1>
                <p className="text-xs text-slate-400 font-semibold">Update your photo and personal details.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-lg text-xs font-bold h-9 px-4 border-slate-200 dark:border-slate-700">Cancel</Button>
                <Button className="rounded-lg text-xs font-bold h-9 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">Save</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Form Fields */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 mt-6">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">

          {/* Full Name */}
          <FormRow label="Full name" sublabel="">
            <div className="flex gap-3 w-full">
              <Input defaultValue="John" className="flex-1 rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700" />
              <Input defaultValue="Doe" className="flex-1 rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700" />
            </div>
          </FormRow>

          {/* Email */}
          <FormRow label="Email address">
            <Input defaultValue="john.doe@uni.edu.gh" className="w-full rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700" />
          </FormRow>

          {/* Phone */}
          <FormRow label="Phone number">
            <Input defaultValue="+233 24 123 4567" className="w-full rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700" />
          </FormRow>

          {/* Your Photo */}
          <FormRow label="Your photo" sublabel="This will be displayed on your profile.">
            <div className="flex items-center gap-4 w-full">
              <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700 shrink-0">
                <AvatarImage src="https://github.com/shadcn.png" alt="@student" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">JD</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-3">
                <button className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer">Delete</button>
                <button className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors cursor-pointer">Update</button>
              </div>
            </div>
          </FormRow>

          {/* Room */}
          <FormRow label="Room">
            <Input defaultValue="Room 104" disabled className="w-full rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" />
          </FormRow>

          {/* Hall */}
          <FormRow label="Hall">
            <Input defaultValue="Atlantic Hall, Floor 1" disabled className="w-full rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" />
          </FormRow>

          {/* Student ID */}
          <FormRow label="Student ID">
            <Input defaultValue="STU-2026-0104" disabled className="w-full rounded-lg h-10 text-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" />
          </FormRow>

        </div>
      </Card>

      {/* Notification Preferences — Collapsible */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs mt-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 shrink-0">
              <Bell className="h-4 w-4 text-[#2563eb]" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Notification Preferences</h2>
              <p className="text-[10px] text-slate-400 font-semibold">Manage how you receive alerts</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${notifOpen ? "rotate-180" : ""}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${notifOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="px-6 pb-6 space-y-4">
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
        </div>
      </Card>

      {/* Contract Info — Collapsible */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs mt-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setContractOpen(!contractOpen)}
          className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-950/30 shrink-0">
              <Building className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Contract Details</h2>
              <p className="text-[10px] text-slate-400 font-semibold">Your subscription & machine info</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${contractOpen ? "rotate-180" : ""}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${contractOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="px-6 pb-6">
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
              <ContractRow label="Status" value={<Badge className="bg-green-50 text-green-600 dark:bg-green-950/30 text-[8px] rounded-full font-bold px-2 py-0.5 border border-green-200/20">Active</Badge>} />
              <ContractRow label="Period" value="Oct 2026 – Feb 2027" />
              <ContractRow label="Weekly Rate" value="GHS 35.00" bold />
              <ContractRow label="Rotation Group" value="Group 1 (7 rooms)" />
              <ContractRow label="Machine" value={<span className="text-[#2563eb]">WEWASH-W01-ATL</span>} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Sub-components ─── */

function FormRow({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-5 first:pt-0 last:pb-0">
      <div className="sm:w-44 shrink-0">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>
        {sublabel && <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ContractRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
      <span className={`text-xs ${bold ? "font-black text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300"}`}>{value}</span>
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
