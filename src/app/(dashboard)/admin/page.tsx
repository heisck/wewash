"use client";

import Link from "next/link";
import {
  ArrowRight,
  Wrench,
  Users,
  Banknote,
  Timer,
  Building2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { useApi } from "@/lib/api/client";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard,
  SectionTitle, StatTile,
} from "@/components/pixel/pixel-ui";
import type { DashboardStats } from "@/lib/types/client";

const cedis = (n: number) =>
  `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function hoursLabel(h: number) {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function AdminDashboard() {
  const { data: stats, loading } = useApi<DashboardStats>("/api/v1/analytics");

  const openFaults = stats?.openFaults ?? 0;
  const transfers = stats?.upcomingTransfers ?? [];
  const locations = stats?.machineLocations ?? [];
  const recentFaults = stats?.recentFaults ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle text="OVERVIEW" sub="Live operations — all figures from the database" />
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/payments">
            <PixelButton>
              Record payment <ArrowRight className="h-3.5 w-3.5" />
            </PixelButton>
          </Link>
          <Link href="/admin/machines">
            <PixelButton variant="outline">Add machine</PixelButton>
          </Link>
          <Link href="/admin/students">
            <PixelButton variant="outline">Register student</PixelButton>
          </Link>
        </div>
      </div>

      {/* Income */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Total income"
          value={loading ? "…" : cedis(stats?.totalIncome ?? 0)}
          sub="All completed payments"
          icon={<Banknote />}
        />
        <StatTile
          label="Weekly income"
          value={loading ? "…" : cedis(stats?.weeklyIncome ?? 0)}
          sub="This calendar week"
          icon={<Banknote />}
        />
        <StatTile
          label="Monthly income"
          value={loading ? "…" : cedis(stats?.monthlyIncome ?? 0)}
          sub="This calendar month"
          icon={<Banknote />}
        />
        <StatTile
          label="Collected"
          value={loading ? "…" : cedis(stats?.amountCollected ?? 0)}
          sub="Confirmed receipts"
          icon={<Banknote />}
        />
        <StatTile
          label="Outstanding"
          value={loading ? "…" : cedis(stats?.outstandingBalance ?? 0)}
          sub="Dues still unpaid"
          icon={<AlertTriangle />}
        />
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="Machines" value={stats?.machines.total ?? 0} />
        <MiniStat label="Active machines" value={stats?.machines.active ?? 0} tone="teal" />
        <MiniStat label="Maintenance" value={stats?.machines.maintenance ?? 0} tone="amber" />
        <MiniStat label="Students" value={stats?.registeredStudents ?? 0} />
        <MiniStat label="Rooms" value={stats?.registeredRooms ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Rotation timeline */}
        <PixelCard className="flex flex-col gap-4 p-5 lg:col-span-7">
          <SectionTitle
            text="ROTATION TIMELINE"
            right={<PixelBadge tone="teal">{transfers.length} upcoming</PixelBadge>}
          />
          {transfers.length === 0 ? (
            <EmptyRow text="No scheduled rotations yet. Assign rooms on the Rotation page." />
          ) : (
            <div className="flex flex-col divide-y-2 divide-teal-900/10 dark:divide-teal-100/10">
              {transfers.slice(0, 8).map((t) => (
                <div key={t.machineId} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                      <Timer className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black tracking-wide text-teal-950 dark:text-teal-50">
                        {t.machineLabel}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/45 dark:text-teal-100/45">
                        {t.currentRoom ?? "—"} → {t.nextRoom ?? "—"}
                        {t.hallCode ? ` · ${t.hallCode}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-teal-700 dark:text-teal-300">
                      {hoursLabel(t.hoursRemaining)}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-teal-900/40">
                      until transfer
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PixelCard>

        {/* Locations + faults */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <PixelCard className="flex flex-col gap-4 p-5">
            <SectionTitle
              text="MACHINE LOCATIONS"
              right={
                <Link href="/admin/machines">
                  <PixelBadge tone="slate">Manage →</PixelBadge>
                </Link>
              }
            />
            {locations.length === 0 ? (
              <EmptyRow text="No machines registered." />
            ) : (
              <div className="flex flex-col divide-y-2 divide-teal-900/10 dark:divide-teal-100/10">
                {locations.slice(0, 6).map((m) => (
                  <div key={m.machineId} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-300" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black">{m.machineLabel}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                          Room {m.currentRoom ?? "—"}
                          {m.hallCode ? ` · ${m.hallCode}` : ""}
                          {m.heldBy ? ` · ${m.heldBy}` : ""}
                        </p>
                      </div>
                    </div>
                    <PixelBadge tone={statusTone(m.status)}>{m.status}</PixelBadge>
                  </div>
                ))}
              </div>
            )}
          </PixelCard>

          <PixelCard className="flex flex-col gap-4 p-5">
            <SectionTitle
              text="STUDENT MESSAGES"
              right={<PixelBadge tone={openFaults ? "red" : "slate"}>{openFaults} open</PixelBadge>}
            />
            {recentFaults.length === 0 ? (
              <EmptyRow text="No fault reports yet." />
            ) : (
              <div className="flex flex-col gap-2">
                {recentFaults.slice(0, 5).map((f) => (
                  <Link
                    key={f.id}
                    href="/admin/faults"
                    className="border-2 border-teal-900/10 p-3 transition-colors hover:border-teal-700/30 dark:border-teal-100/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-black text-teal-950 dark:text-teal-50">{f.title}</p>
                      <PixelBadge tone={f.severity === "CRITICAL" || f.severity === "HIGH" ? "red" : "amber"}>
                        {f.severity}
                      </PixelBadge>
                    </div>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                      {f.studentName ?? "Student"} · {f.machineLabel ?? "Machine"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </PixelCard>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink href="/admin/halls" icon={<Building2 className="h-4 w-4" />} label="Hostels & rooms" />
        <QuickLink href="/admin/rotation" icon={<Timer className="h-4 w-4" />} label="Rotation schedule" />
        <QuickLink href="/admin/students" icon={<Users className="h-4 w-4" />} label="Students" />
      </div>
    </div>
  );
}

function statusTone(status: string): "green" | "amber" | "red" | "slate" {
  if (status === "ACTIVE") return "green";
  if (status === "MAINTENANCE") return "amber";
  if (status === "FAULTY") return "red";
  return "slate";
}

function MiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "teal" | "rose" | "amber" | "slate";
}) {
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

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-2 border-teal-900/15 bg-white p-4 transition-colors hover:border-teal-700/40 dark:border-teal-100/15 dark:bg-teal-950/40"
    >
      <span className="flex h-9 w-9 items-center justify-center border-2 border-teal-900/20 text-teal-700 dark:border-teal-100/20 dark:text-teal-300">
        {icon}
      </span>
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      <Wrench className="ml-auto h-3.5 w-3.5 opacity-0" aria-hidden />
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-teal-900/40" />
    </Link>
  );
}
