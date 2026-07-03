"use client";

import {
  ShieldCheck, AlertTriangle, CheckCircle, Clock, Info, Wrench, Droplet,
} from "lucide-react";
import { BlockyText, FONT3 } from "@/components/pixel/blocky-text";
import {
  PageTitle, PixelCard, SectionTitle, StatTile,
} from "@/components/pixel/pixel-ui";

const careRules = [
  { text: "Never disconnect tap hoses while machine is running", icon: AlertTriangle },
  { text: "Lock the base wheels before starting any wash cycle", icon: ShieldCheck },
  { text: "Room swap occurs daily at 8:00 PM — ensure machine is idle", icon: Clock },
  { text: "Use only recommended detergent amounts (see label on lid)", icon: Droplet },
  { text: "Report any unusual noise or leaks immediately via the app", icon: Wrench },
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
    <div className="space-y-10 pb-12">
      <PageTitle text="GUIDE" sub="Appliance care & transfer manual" />

      {/* ─── Safety & care rules ─── */}
      <div className="space-y-4">
        <SectionTitle text="SAFETY & CARE RULES" />
        <div className="space-y-3">
          {careRules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <PixelCard key={i} className="flex items-center gap-4 p-4 shadow-pixel-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-xs font-bold leading-relaxed text-teal-950 dark:text-teal-50">
                  {rule.text}
                </p>
                <span className="ml-auto hidden shrink-0 text-[9px] font-black uppercase tracking-widest text-teal-900/30 dark:text-teal-100/30 sm:block">
                  Rule {String(i + 1).padStart(2, "0")}
                </span>
              </PixelCard>
            );
          })}
        </div>
      </div>

      {/* ─── Room transfer procedure ─── */}
      <div className="space-y-4">
        <SectionTitle text="ROOM TRANSFER PROCEDURE" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transferSteps.map((s) => (
            <PixelCard
              key={s.step}
              bolts
              className="group flex flex-col gap-3 p-5 transition-transform duration-150 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <BlockyText
                  text={String(s.step)}
                  font={FONT3}
                  className="fill-teal-600 transition-transform duration-150 group-hover:scale-110 dark:fill-teal-400"
                  style={{ height: "28px" }}
                />
                {/* Step progress pips */}
                <div className="flex gap-1" aria-hidden="true">
                  {transferSteps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 ${
                        i < s.step
                          ? "bg-teal-600 dark:bg-teal-400"
                          : "bg-teal-900/15 dark:bg-teal-100/15"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-white">
                {s.title}
              </p>
              <p className="text-[11px] font-semibold leading-relaxed text-teal-900/60 dark:text-teal-100/60">
                {s.desc}
              </p>
            </PixelCard>
          ))}
        </div>
      </div>

      {/* ─── Machine facts ─── */}
      <div className="space-y-4">
        <SectionTitle text="MACHINE FACTS" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Max load" value="7 kg" sub="Per wash cycle" icon={<Info />} />
          <StatTile label="Cycle time" value="45 min" sub="Standard wash" icon={<Clock />} />
          <StatTile label="Rooms served" value="7" sub="Per rotation group" icon={<CheckCircle />} />
        </div>
      </div>
    </div>
  );
}
