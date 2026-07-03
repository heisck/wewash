"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar, Mic, ArrowRight, Lock, Wrench,
  Heart, Star, Smile, Meh, Frown, Edit3, Users, Banknote, Timer,
} from "lucide-react";
import { BlockyText, FONT3, FONT5 } from "@/components/pixel/blocky-text";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelIconButton,
  SectionTitle, SegmentBar, StatTile,
} from "@/components/pixel/pixel-ui";

const roomUsage = [
  { room: "Room 101", loads: 26, max: 30 },
  { room: "Room 102", loads: 21, max: 30 },
  { room: "Room 103", loads: 14, max: 30 },
];

const loadBars = [30, 60, 45, 90, 75, 55, 80];

export default function AdminDashboard() {
  const [feedback, setFeedback] = useState<"frown" | "meh" | "smile" | "heart" | "star">("smile");

  const feedbackMeta = {
    frown: { Icon: Frown, label: "ROUGH TRANSFER" },
    meh: { Icon: Meh, label: "JUST OKAY" },
    smile: { Icon: Smile, label: "SMOOTH TRANSFER" },
    heart: { Icon: Heart, label: "LOVED IT!" },
    star: { Icon: Star, label: "FIVE STARS!" },
  } as const;
  const ActiveFeedbackIcon = feedbackMeta[feedback].Icon;

  return (
    <div className="space-y-8">
      {/* ─── Header row ─── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <PixelCard className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5">
            <BlockyText
              text="19"
              font={FONT3}
              className="fill-teal-950 dark:fill-white"
              style={{ height: "18px" }}
            />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
              Dec
            </span>
          </PixelCard>
          <PageTitle text="OVERVIEW" sub="Atlantic Hall UCC - live operations" />
          <div className="flex items-center gap-3 pb-0.5">
            <Link href="/admin/students">
              <PixelButton>
                Record payment <ArrowRight className="h-3.5 w-3.5" />
              </PixelButton>
            </Link>
            <PixelIconButton alert aria-label="Rotation calendar" onClick={() => toast.info("Rotation calendar coming soon.")}>
              <Calendar className="h-4 w-4" />
            </PixelIconButton>
          </div>
        </div>

        {/* Help + mic */}
        <div className="flex items-center gap-4 lg:justify-end">
          <div className="text-left lg:text-right">
            <BlockyText
              text="NEED HELP?"
              font={FONT5}
              className="fill-teal-950 dark:fill-white"
              style={{ height: "14px" }}
            />
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              Just ask me anything!
            </p>
          </div>
          <PixelIconButton
            className="h-12 w-12"
            aria-label="Voice assistant"
            onClick={() => toast.info("Listening... just kidding, voice ops coming soon.")}
          >
            <Mic className="h-5 w-5" />
          </PixelIconButton>
        </div>
      </div>

      {/* ─── Stat tiles ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total income" value="₵1,400" sub="Weekly aggregate" icon={<Banknote />} />
        <StatTile label="Dues collected" value="₵1,020" sub="+9.3% this week" icon={<Users />} />
        <StatTile
          label="Capacity"
          value="36%"
          sub={<SegmentBar value={36} max={100} segments={12} className="mt-1 h-2" />}
          icon={<Wrench />}
        />
        <StatTile label="Timeline" value="6 days" sub="To next inspection" icon={<Timer />} />
      </div>

      {/* ─── Main grid ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Machine card */}
        <PixelCard bolts className="flex flex-col justify-between gap-5 p-5 lg:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                WeWash group
              </p>
              <p className="mt-1 text-sm font-black tracking-wide text-teal-950 dark:text-white">
                WEWASH-W01-ATL
              </p>
              <p className="text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                Linked to active rooms
              </p>
            </div>
            <PixelBadge tone="slate">Atlantic ▾</PixelBadge>
          </div>

          <div className="flex items-center justify-center border-2 border-teal-900/15 bg-gradient-to-b from-[#f0fdfc] to-[#c9efe7] py-3 dark:border-teal-100/15 dark:from-[#0f2d2b] dark:to-[#04100f]">
            <img
              src="/images/machine.webp"
              alt="WEWASH-W01-ATL washing machine"
              className="h-24 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <PixelButton size="sm" variant="dark">Active</PixelButton>
            <PixelButton size="sm" variant="outline">Schedule</PixelButton>
          </div>

          <div className="flex items-center justify-between border-t-2 border-teal-900/10 pt-3 dark:border-teal-100/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
              GHS 35.00/wk
            </span>
            <Link
              href="/admin/machines"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
            >
              Edit <Edit3 className="h-3 w-3" />
            </Link>
          </div>
        </PixelCard>

        {/* Usage by room */}
        <PixelCard className="flex flex-col gap-5 p-5 lg:col-span-4">
          <SectionTitle text="USAGE BY ROOM" right={<PixelBadge tone="slate">2026 ▾</PixelBadge>} />
          <div className="flex flex-1 flex-col justify-center gap-5">
            {roomUsage.map((r) => (
              <div key={r.room}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
                    {r.room}
                  </span>
                  <span className="text-[10px] font-black text-teal-900/50 dark:text-teal-100/50">
                    {r.loads} loads
                  </span>
                </div>
                <SegmentBar value={r.loads} max={r.max} segments={15} />
              </div>
            ))}
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">
            Total loads this semester: 61
          </p>
        </PixelCard>

        {/* Right stack: system lock + weekly load */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <PixelCard className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-teal-950 dark:text-white">
                  Bases locked
                </p>
                <p className="text-[9px] font-bold text-teal-900/50 dark:text-teal-100/50">
                  Stabilizers secure
                </p>
              </div>
            </div>
            <span className="h-2.5 w-2.5 bg-emerald-500" aria-hidden="true" />
          </PixelCard>

          <PixelCard className="flex flex-1 flex-col justify-between gap-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                Weekly load
              </p>
              <PixelBadge tone="teal">+9.3%</PixelBadge>
            </div>
            <div className="flex h-20 items-end gap-1.5">
              {loadBars.map((h, i) => (
                <span
                  key={i}
                  className={`flex-1 ${
                    i === loadBars.length - 1
                      ? "bg-teal-600 dark:bg-teal-400"
                      : "bg-teal-600/30 dark:bg-teal-400/30"
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">
              Aggregate dues collection trend
            </p>
          </PixelCard>
        </div>

        {/* Activity manager */}
        <PixelCard className="flex flex-col gap-5 p-5 lg:col-span-8">
          <SectionTitle
            text="ACTIVITY MANAGER"
            right={
              <div className="flex gap-1.5">
                <PixelBadge tone="slate">Team</PixelBadge>
                <PixelBadge tone="slate">Insights</PixelBadge>
                <PixelBadge tone="teal">Today</PixelBadge>
              </div>
            }
          />
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Weekly rate */}
            <div className="flex flex-col justify-between gap-3 border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15 dark:bg-teal-400/5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
                  Weekly rate
                </p>
                <p className="mt-1 text-lg font-black text-teal-950 dark:text-white">₵35.00</p>
              </div>
              <div className="flex h-10 items-end gap-1">
                {[4, 6, 8, 5, 7, 9, 3, 5].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 bg-teal-600 dark:bg-teal-400"
                    style={{ height: `${h * 10}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Inspections */}
            <div className="flex flex-col justify-between gap-3 border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15 dark:bg-teal-400/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
                Inspections
              </p>
              <div className="space-y-2 text-[10px] font-bold text-teal-950 dark:text-teal-50">
                <div className="flex items-center gap-2">
                  <span className="flex h-3.5 w-3.5 items-center justify-center bg-teal-600 text-[8px] font-black text-white dark:bg-teal-400 dark:text-teal-950">✓</span>
                  Check tap seals
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-3.5 w-3.5 items-center justify-center bg-teal-600 text-[8px] font-black text-white dark:bg-teal-400 dark:text-teal-950">✓</span>
                  Vibration check
                </div>
                <div className="flex items-center gap-2 text-teal-900/40 dark:text-teal-100/40">
                  <span className="flex h-3.5 w-3.5 items-center justify-center border border-teal-900/30 text-[8px] font-black dark:border-teal-100/30">2</span>
                  Clean filter
                </div>
              </div>
            </div>

            {/* Wrench action */}
            <div className="flex flex-col justify-between gap-3 border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15 dark:bg-teal-400/5">
              <span className="flex h-8 w-8 items-center justify-center border-2 border-teal-900/20 bg-white text-teal-700 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-300">
                <Wrench className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10px] font-semibold leading-normal text-teal-900/60 dark:text-teal-100/60">
                Review coiling steps & stabilize base.
              </p>
              <PixelButton size="sm" className="w-full" onClick={() => toast.info("Inspection checklist opened.")}>
                Inspect
              </PixelButton>
            </div>
          </div>
        </PixelCard>

        {/* Room feedback */}
        <PixelCard bolts className="flex flex-col justify-between gap-4 p-5 lg:col-span-4">
          <div>
            <SectionTitle text="ROOM FEEDBACK" />
            <p className="mt-2 text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
              How was the transfer of the machine stand today?
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2.5 border-2 border-teal-900/15 bg-teal-600/5 p-5 dark:border-teal-100/15 dark:bg-teal-400/5">
            <ActiveFeedbackIcon className="h-10 w-10 animate-bounce text-teal-600 dark:text-teal-400" />
            <BlockyText
              text={feedbackMeta[feedback].label}
              font={FONT3}
              className="fill-teal-950 dark:fill-teal-50"
              style={{ height: "9px" }}
            />
            <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              Checked by Room 104
            </p>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {(["frown", "meh", "smile", "heart", "star"] as const).map((type) => {
              const Icon = feedbackMeta[type].Icon;
              const isActive = feedback === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-label={feedbackMeta[type].label}
                  onClick={() => setFeedback(type)}
                  className={`flex h-9 w-9 cursor-pointer items-center justify-center border-2 transition-all duration-150 ${
                    isActive
                      ? "-translate-y-0.5 border-teal-950/60 bg-teal-600 text-white shadow-pixel-sm dark:border-teal-100/50 dark:bg-teal-500 dark:text-teal-950"
                      : "border-teal-900/20 bg-white text-teal-900/50 hover:border-teal-900/50 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-100/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </PixelCard>
      </div>
    </div>
  );
}
