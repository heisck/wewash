"use client";

import Image from "next/image";
import {
  Droplet, ShieldCheck, AlertTriangle, ArrowRight,
  CheckCircle, Clock, Info, Wrench
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const careRules = [
  { text: "Never disconnect tap hoses while machine is running", icon: AlertTriangle, color: "text-red-500" },
  { text: "Lock the base wheels before starting any wash cycle", icon: ShieldCheck, color: "text-blue-500" },
  { text: "Room swap occurs daily at 8:00 PM — ensure machine is idle", icon: Clock, color: "text-amber-500" },
  { text: "Use only recommended detergent amounts (see label on lid)", icon: Droplet, color: "text-cyan-500" },
  { text: "Report any unusual noise or leaks immediately via the app", icon: Wrench, color: "text-slate-500" },
];

const transferSteps = [
  { step: 1, title: "Check Schedule", desc: "Verify today's rotation on the dashboard clock." },
  { step: 2, title: "Idle Machine", desc: "Ensure no active wash cycle. Wait if a cycle is running." },
  { step: 3, title: "Unlock Wheels", desc: "Disengage the wheel locks on the movable base." },
  { step: 4, title: "Roll to Room", desc: "Carefully move the machine to the assigned room." },
  { step: 5, title: "Reconnect Hoses", desc: "Attach water inlet and drain hoses securely." },
  { step: 6, title: "Lock & Confirm", desc: "Lock the wheels and confirm transfer on the app." },
];

export default function GuidelinesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">Appliance Guide</h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Everything you need to know about using and moving the shared washing machine.</p>
      </div>

      {/* Care Rules */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Safety & Care Rules</h2>
        </div>

        <div className="space-y-3">
          {careRules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 shadow-xs border border-slate-200/50 dark:border-slate-700`}>
                  <Icon className={`h-4 w-4 ${rule.color}`} />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed pt-1.5">{rule.text}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Transfer Steps */}
      <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <ArrowRight className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Room Transfer Procedure</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {transferSteps.map((s) => (
            <div key={s.step} className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative">
              <div className="h-7 w-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-black mb-3">
                {s.step}
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">{s.title}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>


      {/* Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Load</span>
            <Info className="h-4 w-4 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">7 kg</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Per wash cycle</p>
        </Card>

        <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cycle Time</span>
            <Clock className="h-4 w-4 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">45 min</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Standard wash</p>
        </Card>

        <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rooms Served</span>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">7</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Per rotation group</p>
        </Card>
      </div>
    </div>
  );
}
