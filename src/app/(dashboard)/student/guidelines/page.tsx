"use client";

import {
  ShieldCheck, AlertTriangle, ArrowRight,
  CheckCircle, Clock, Info, Wrench, Droplet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Carousel from "@/components/ui/carousel";

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
  const carouselItems = transferSteps.map((s) => ({
    id: s.step,
    title: s.title,
    description: s.desc,
    icon: (
      <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
        {s.step}
      </span>
    )
  }));

  return (
    <div className="space-y-0 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">Appliance Guide</h1>
      </div>

      {/* Line Space Divider 1 */}
      <div className="border-t border-slate-200 dark:border-slate-800 my-8" />

      {/* Care Rules */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Safety & Care Rules</h2>
        </div>

        <div className="space-y-3">
          {careRules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 shadow-xs border border-slate-200/50 dark:border-slate-700">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed pt-1.5">{rule.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line Space Divider 2 */}
      <div className="border-t border-slate-200 dark:border-slate-800 my-8" />

      {/* Transfer Steps */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Room Transfer Procedure</h2>
        </div>

        <div className="flex justify-center w-full py-4">
          <Carousel
            items={carouselItems}
            baseWidth={320}
            autoplay={true}
            autoplayDelay={3500}
            pauseOnHover={true}
            loop={true}
            round={true}
          />
        </div>
      </div>

      {/* Line Space Divider 3 */}
      <div className="border-t border-slate-200 dark:border-slate-800 my-8" />

      {/* Summary Metrics Bar - Edge to Edge */}
      <div className="-mx-6 md:-mx-8 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* Max Load */}
          <div className="pl-6 md:pl-8 pr-4 sm:pr-5 py-4 sm:py-5 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Max Load</span>
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">7 kg</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1 truncate">Per wash cycle</p>
            </div>
          </div>

          {/* Cycle Time */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Cycle Time</span>
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">45 min</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1 truncate">Standard wash</p>
            </div>
          </div>

          {/* Rooms Served */}
          <div className="pl-4 sm:pl-5 pr-6 md:pr-8 py-4 sm:py-5 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Rooms Served</span>
              <CheckCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">7</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1 truncate">Per rotation group</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
