"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ScanLine, Smile, Meh, Frown, Heart, Star, Lock,
  Wrench, Clock, MapPin, CheckCircle2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel, PixelSelect, PixelTextarea, SectionTitle, SegmentBar } from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import { useCountdown } from "@/hooks/use-countdown";
import type { StudentRotation, ActiveSession, MachineDTO, FaultDTO } from "@/lib/types/client";

const feedbackConfig = {
  frown: { Icon: Frown, label: "COULD BE BETTER" },
  meh: { Icon: Meh, label: "JUST OKAY" },
  smile: { Icon: Smile, label: "SMOOTH & CLEAN" },
  heart: { Icon: Heart, label: "LOVED THE SERVICE!" },
  star: { Icon: Star, label: "EXCELLENT!" },
} as const;

export default function StudentDashboard() {
  const router = useRouter();
  const { data: rotation } = useApi<StudentRotation>("/api/v1/me/rotation");
  const { data: active } = useApi<ActiveSession>("/api/v1/scan");
  const { data: machines } = useApi<MachineDTO[]>("/api/v1/machines?limit=50");
  const { data: faults, reload: reloadFaults } = useApi<FaultDTO[]>("/api/v1/faults?limit=6");

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [faultTitle, setFaultTitle] = useState("");
  const [faultDesc, setFaultDesc] = useState("");
  const [faultSeverity, setFaultSeverity] = useState("MEDIUM");
  const [faultMachine, setFaultMachine] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<keyof typeof feedbackConfig | null>(null);

  // Countdown: if the machine is in hand, count to handoff; else to next turn.
  const inHand = !!active;
  const countdownTarget = inHand ? active!.dueBackAt : rotation?.nextTurnAt ?? null;
  const { label: countdownLabel } = useCountdown(countdownTarget);

  const machineOptions = machines ?? [];
  const defaultMachineId = faultMachine || active?.machine.id || rotation?.machine.id || machineOptions[0]?.id || "";

  const handleReportFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultMachineId) return toast.error("No machine available to report on.");
    setSubmitting(true);
    try {
      await api.post("/api/v1/faults", {
        machineId: defaultMachineId,
        title: faultTitle,
        description: faultDesc,
        severity: faultSeverity,
      });
      toast.success("Ticket sent — the admin has been notified.");
      setFaultTitle("");
      setFaultDesc("");
      setIsReportOpen(false);
      reloadFaults();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not submit the report.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitFeedback = (rating: keyof typeof feedbackConfig) => {
    setFeedbackRating(rating);
    toast.success(`Thanks for the feedback: ${feedbackConfig[rating].label.toLowerCase()}`);
  };

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle
          text="TODAY"
          sub={rotation ? `Your turn: ${titleCase(rotation.myDay)} ${rotation.myStartTime} · Room ${rotation.myRoom.number}` : "Your rotation"}
        />
        <div className="flex flex-wrap items-center gap-3">
          <PixelButton variant="danger" onClick={() => setIsReportOpen(true)}>
            <Wrench className="h-3.5 w-3.5" />
            Report fault
          </PixelButton>
          <PixelButton onClick={() => router.push("/scan")}>
            <ScanLine className="h-3.5 w-3.5" />
            Scan machine
          </PixelButton>
        </div>
      </div>

      {/* ─── Active appliance panel ─── */}
      <PixelCard bolts className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          <div className="relative flex items-center justify-center border-b-2 border-teal-900/25 bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] p-6 dark:border-teal-100/20 dark:from-[#0f2d2b] dark:to-[#04100f] md:border-b-0 md:border-r-2">
            <img src="/images/machine.webp" alt="Your assigned washing machine" className="h-40 w-auto object-contain md:h-44" />
            <PixelBadge tone={inHand ? "teal" : "slate"} className="absolute left-3 top-3">
              <span className={`h-1.5 w-1.5 ${inHand ? "animate-pulse bg-teal-600 dark:bg-teal-300" : "bg-teal-900/40"}`} />
              {inHand ? "In your hands" : rotation?.isHereNow ? "In your room" : "Not here yet"}
            </PixelBadge>
          </div>

          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  {inHand ? "Active session" : "Your machine"}
                </p>
                <p className="mt-1 text-sm font-black tracking-wide text-teal-950 dark:text-white">
                  {active?.machine.serialNumber || rotation?.machine.serialNumber || "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  {rotation ? `Room ${rotation.myRoom.number}${rotation.hall ? ` · ${rotation.hall.code}` : ""}` : "Unassigned"}
                </p>
                {inHand && active?.minutesLate != null && active.minutesLate > 0 && (
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    {formatMins(active.minutesLate)} late
                  </p>
                )}
              </div>
            </div>

            {/* Live countdown */}
            <div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black tabular-nums text-teal-600 dark:text-teal-400 sm:text-6xl">
                  {countdownLabel}
                </span>
                <span className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  {inHand ? "until handoff" : "until your turn"}
                </span>
              </div>
              {inHand && active && <SessionProgress active={active} />}
            </div>
          </div>
        </div>
      </PixelCard>

      {/* ─── Feedback (gated on possession) ─── */}
      <div className="mx-auto w-full max-w-lg">
        <PixelCard bolts className="relative flex min-h-[260px] flex-col justify-between gap-5 p-6 sm:p-8">
          <div>
            <SectionTitle text="HOSTEL FEEDBACK" />
            <p className="mt-2 text-[11px] font-bold text-teal-900/50 dark:text-teal-100/50">
              {inHand ? "How was your laundry experience today?" : "Scan the machine to check in and leave feedback."}
            </p>
          </div>

          <div className="flex min-h-[110px] flex-col items-center justify-center gap-3 border-2 border-teal-900/15 bg-teal-600/5 p-6 dark:border-teal-100/15 dark:bg-teal-400/5">
            {feedbackRating ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
                  {feedbackConfig[feedbackRating].label}
                </p>
              </>
            ) : (
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
                {inHand ? "Tap a face below" : "Locked until check-in"}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2.5">
            {(Object.keys(feedbackConfig) as (keyof typeof feedbackConfig)[]).map((type) => {
              const ButtonIcon = feedbackConfig[type].Icon;
              const isActive = feedbackRating === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!inHand}
                  aria-label={feedbackConfig[type].label}
                  onClick={() => submitFeedback(type)}
                  className={`flex h-10 w-10 items-center justify-center border-2 transition-all duration-150 ${
                    isActive
                      ? "-translate-y-0.5 border-teal-950/60 bg-teal-600 text-white shadow-pixel-sm dark:border-teal-100/50 dark:bg-teal-500 dark:text-teal-950"
                      : "border-teal-900/20 bg-white text-teal-900/50 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-100/50"
                  } ${inHand ? "cursor-pointer hover:border-teal-900/50" : "cursor-not-allowed opacity-50"}`}
                >
                  <ButtonIcon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          {!inHand && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] dark:bg-teal-950/40">
              <span className="flex items-center gap-2 border-2 border-teal-900/30 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-800 shadow-pixel-sm dark:border-teal-100/30 dark:bg-teal-950 dark:text-teal-200">
                <Lock className="h-3.5 w-3.5" /> Scan to unlock
              </span>
            </div>
          )}
        </PixelCard>
      </div>

      {/* ─── Activity log (real faults) ─── */}
      <div className="space-y-4">
        <SectionTitle text="YOUR REPORTS" />
        <PixelCard className="divide-y-2 divide-teal-900/10 dark:divide-teal-100/10">
          {(!faults || faults.length === 0) ? (
            <div className="flex items-center justify-center px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              No fault reports yet.
            </div>
          ) : (
            faults.map((f) => (
              <div key={f.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-teal-950 dark:text-white">{f.title}</p>
                  <p className="truncate text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                    {f.machine?.serialNumber ?? ""} · {f.severity}
                  </p>
                </div>
                <PixelBadge tone={f.status === "RESOLVED" || f.status === "CLOSED" ? "green" : "amber"}>
                  {f.status}
                </PixelBadge>
              </div>
            ))
          )}
        </PixelCard>
      </div>

      {/* ─── Report fault dialog ─── */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">Report machine fault</DialogTitle>
            <DialogDescription>Help us keep WeWash running. Submit details of the fault.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportFault} className="space-y-4 py-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="machine">Machine</PixelLabel>
              <PixelSelect id="machine" value={defaultMachineId} onChange={(e) => setFaultMachine(e.target.value)}>
                {machineOptions.length === 0 && <option value="">No machines</option>}
                {machineOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.serialNumber}
                    {m.hall?.code ? ` (${m.hall.code})` : ""}
                  </option>
                ))}
              </PixelSelect>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="issue">Issue summary</PixelLabel>
              <PixelInput id="issue" placeholder="e.g. Spin cycle is extremely noisy" value={faultTitle} onChange={(e) => setFaultTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="details">Detailed description</PixelLabel>
              <PixelTextarea id="details" placeholder="Explain what happened and any error codes shown..." value={faultDesc} onChange={(e) => setFaultDesc(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="severity">Severity</PixelLabel>
              <PixelSelect id="severity" value={faultSeverity} onChange={(e) => setFaultSeverity(e.target.value)}>
                <option value="LOW">Low (cosmetic / minor)</option>
                <option value="MEDIUM">Medium (noisy but washes)</option>
                <option value="HIGH">High (blocked drain / no spin)</option>
                <option value="CRITICAL">Critical (total breakdown)</option>
              </PixelSelect>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <PixelButton type="button" variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</PixelButton>
              <PixelButton type="submit" variant="danger" disabled={submitting}>
                {submitting ? "Sending..." : "Submit ticket"}
              </PixelButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionProgress({ active }: { active: NonNullable<ActiveSession> }) {
  const start = new Date(active.expectedStartAt).getTime();
  const end = new Date(active.dueBackAt).getTime();
  const now = Date.now();
  const totalHours = Math.max(1, Math.round((end - start) / 3600000));
  const usedHours = Math.max(0, Math.min(totalHours, Math.round((now - start) / 3600000)));
  return (
    <>
      <SegmentBar value={usedHours} max={totalHours} segments={24} className="mt-4" label="Window used" />
      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">
        {usedHours} of {totalHours} hours used
      </p>
    </>
  );
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
