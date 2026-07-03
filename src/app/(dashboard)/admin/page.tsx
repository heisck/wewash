"use client";

import Link from "next/link";
import { ArrowRight, Lock, Wrench, Users, Banknote, Timer, Activity } from "lucide-react";
import { useApi } from "@/lib/api/client";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard,
  SectionTitle, SegmentBar, StatTile,
} from "@/components/pixel/pixel-ui";
import type { DashboardStats, MachineDTO } from "@/lib/types/client";

const cedis = (n: number) => `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 0 })}`;

export default function AdminDashboard() {
  const { data: stats, loading } = useApi<DashboardStats>("/api/v1/analytics");
  const { data: machines } = useApi<MachineDTO[]>("/api/v1/machines?limit=50");

  const machineList = machines ?? [];
  const total = stats?.machines.total ?? 0;
  const active = stats?.machines.active ?? 0;
  const capacityPct = total ? Math.round((active / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ─── Header row ─── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <PageTitle text="OVERVIEW" sub="Live operations" />
          <div className="flex items-center gap-3 pb-0.5">
            <Link href="/admin/students">
              <PixelButton>
                Record payment <ArrowRight className="h-3.5 w-3.5" />
              </PixelButton>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Stat tiles (live) ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenue"
          value={loading ? "…" : cedis(stats?.revenue ?? 0)}
          sub="Collected to date"
          icon={<Banknote />}
        />
        <StatTile
          label="Active students"
          value={loading ? "…" : String(stats?.activeStudents ?? 0)}
          sub="Subscribed"
          icon={<Users />}
        />
        <StatTile
          label="Machine uptime"
          value={loading ? "…" : `${capacityPct}%`}
          sub={<SegmentBar value={capacityPct} max={100} segments={12} className="mt-1 h-2" label="Machine uptime" />}
          icon={<Activity />}
        />
        <StatTile
          label="Active contracts"
          value={loading ? "…" : String(stats?.activeContracts ?? 0)}
          sub="Running subscriptions"
          icon={<Timer />}
        />
      </div>

      {/* ─── Main grid ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Fleet health */}
        <PixelCard className="flex flex-col gap-4 p-5 lg:col-span-4">
          <SectionTitle text="FLEET HEALTH" right={<PixelBadge tone="teal">{total} total</PixelBadge>} />
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Active" value={stats?.machines.active ?? 0} tone="teal" />
            <MiniStat label="Faulty" value={stats?.machines.faulty ?? 0} tone="rose" />
            <MiniStat label="Maintenance" value={stats?.machines.maintenance ?? 0} tone="amber" />
            <MiniStat label="Total" value={total} tone="slate" />
          </div>
          <div className="flex items-center gap-3 border-t-2 border-teal-900/10 pt-3 dark:border-teal-100/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
              <Lock className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold text-teal-900/60 dark:text-teal-100/60">
              Bases locked & stabilizers secure across the fleet.
            </p>
          </div>
        </PixelCard>

        {/* Machines list (live) */}
        <PixelCard className="flex flex-col gap-4 p-5 lg:col-span-8">
          <SectionTitle
            text="MACHINES"
            right={
              <Link href="/admin/machines">
                <PixelBadge tone="slate">Manage →</PixelBadge>
              </Link>
            }
          />
          {machineList.length === 0 ? (
            <EmptyRow text="No machines yet. Add one from the Machines page." />
          ) : (
            <div className="flex flex-col divide-y-2 divide-teal-900/10 dark:divide-teal-100/10">
              {machineList.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center border-2 border-teal-900/20 bg-white text-teal-700 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-300">
                      <Wrench className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-black tracking-wide text-teal-950 dark:text-teal-50">
                        {m.serialNumber}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
                        {m.hall?.code ?? "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <PixelBadge tone={statusTone(m.status)}>{m.status}</PixelBadge>
                </div>
              ))}
            </div>
          )}
        </PixelCard>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: "teal" | "rose" | "amber" | "slate" }) {
  const toneClass = {
    teal: "text-teal-700 dark:text-teal-300",
    rose: "text-rose-600 dark:text-rose-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-teal-950 dark:text-teal-50",
  }[tone];
  return (
    <div className="border-2 border-teal-900/15 bg-teal-600/5 p-3 dark:border-teal-100/15 dark:bg-teal-400/5">
      <p className={`text-2xl font-black ${toneClass}`}>{value}</p>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
        {label}
      </p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center border-2 border-dashed border-teal-900/20 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-teal-900/40 dark:border-teal-100/20 dark:text-teal-100/40">
      {text}
    </div>
  );
}

function statusTone(status: MachineDTO["status"]): "teal" | "amber" | "red" | "slate" {
  if (status === "ACTIVE") return "teal";
  if (status === "MAINTENANCE") return "amber";
  if (status === "FAULTY") return "red";
  return "slate";
}
