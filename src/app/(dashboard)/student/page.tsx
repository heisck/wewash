"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ScanLine,
  Smile,
  Meh,
  Frown,
  Heart,
  Star,
  Lock,
  Wrench,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
  PixelSelect,
  PixelTextarea,
  SectionTitle,
  SegmentBar,
  CountdownBoxes,
  StatTile,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import { useCountdown } from "@/hooks/use-countdown";
import { usePush } from "@/hooks/use-push";
import type {
  StudentRotation,
  ActiveSession,
  FaultDTO,
  MeResponse,
  WeekDuesStatus,
} from "@/lib/types/client";

const feedbackConfig = {
  frown: { Icon: Frown, label: "COULD BE BETTER" },
  meh: { Icon: Meh, label: "JUST OKAY" },
  smile: { Icon: Smile, label: "SMOOTH & CLEAN" },
  heart: { Icon: Heart, label: "LOVED THE SERVICE!" },
  star: { Icon: Star, label: "EXCELLENT!" },
} as const;

type FeedbackKey = keyof typeof feedbackConfig;

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const cedis = (n: number) =>
  `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function StudentDashboard() {
  const router = useRouter();
  const { data: me, loading: meLoading } = useApi<MeResponse>("/api/v1/me");
  const hasStudent = !!me?.student;
  const { data: rotation, loading: rotLoading } = useApi<StudentRotation>(
    hasStudent ? "/api/v1/me/rotation" : null
  );
  const {
    data: active,
    reload: reloadActive,
    loading: activeLoading,
  } = useApi<ActiveSession>(hasStudent ? "/api/v1/scan" : null);
  const { data: dues } = useApi<WeekDuesStatus>(
    hasStudent ? "/api/v1/me/dues" : null
  );
  const { data: faults, reload: reloadFaults } = useApi<FaultDTO[]>(
    hasStudent ? "/api/v1/faults?limit=8" : null
  );

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [faultTitle, setFaultTitle] = useState("");
  const [faultDesc, setFaultDesc] = useState("");
  const [faultSeverity, setFaultSeverity] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<FeedbackKey | null>(
    null
  );
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  const inHand = !!active;
  const countdownTarget = inHand
    ? active!.dueBackAt
    : rotation?.nextTurnAt ?? null;
  const countdown = useCountdown(countdownTarget);
  const { supported: pushSupported, subscribed: pushOn, subscribe: pushSubscribe } =
    usePush();

  const machineId =
    active?.machine.id || rotation?.machine.id || "";
  const machineLabel =
    active?.machine.serialNumber ||
    rotation?.machine.code ||
    rotation?.machine.serialNumber ||
    "—";

  const weekly = dues?.weeklyAmount ?? Number(me?.student?.weeklyAmount ?? 0);
  const paidWeek = dues?.paidThisWeek ?? 0;
  const remaining = dues?.remaining ?? Math.max(0, weekly - paidWeek);
  const paidFull = dues?.isPaidInFull ?? (weekly <= 0 || paidWeek + 1e-6 >= weekly);

  useEffect(() => {
    if (active?.feedbackRating && active.feedbackRating in feedbackConfig) {
      setFeedbackRating(active.feedbackRating as FeedbackKey);
    } else if (!active) {
      setFeedbackRating(null);
    }
  }, [active?.id, active?.feedbackRating]);

  const handleReportFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId) {
      return toast.error(
        "No machine on your schedule yet. Contact admin if this is wrong."
      );
    }
    setSubmitting(true);
    try {
      await api.post("/api/v1/faults", {
        machineId,
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

  const submitFeedback = async (rating: FeedbackKey) => {
    if (!inHand || feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      await api.post("/api/v1/scan", { feedbackRating: rating });
      setFeedbackRating(rating);
      toast.success(
        `Thanks — ${feedbackConfig[rating].label.toLowerCase()}`
      );
      reloadActive();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not save feedback.");
    } finally {
      setFeedbackBusy(false);
    }
  };

  const slots = rotation?.slots?.length
    ? rotation.slots
    : rotation
      ? [{ dayOfWeek: rotation.myDay, startTime: rotation.myStartTime }]
      : [];

  const loading = meLoading || rotLoading || activeLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle
          text="TODAY"
          sub={
            loading
              ? "Loading your schedule…"
              : rotation
                ? `Next: ${titleCase(rotation.myDay)} ${rotation.myStartTime} · Room ${rotation.myRoom.number}`
                : "No wash day assigned yet"
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <PixelButton
            variant="danger"
            onClick={() => setIsReportOpen(true)}
            disabled={!machineId}
          >
            <Wrench className="h-3.5 w-3.5" />
            Report fault
          </PixelButton>
          <PixelButton onClick={() => router.push("/scan")}>
            <ScanLine className="h-3.5 w-3.5" />
            Scan machine
          </PixelButton>
        </div>
      </div>

      {/* Dues strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="This week’s fee"
          value={cedis(weekly)}
          sub={paidFull ? "Paid in full" : `${cedis(remaining)} left`}
          icon={<CreditCard />}
        />
        <StatTile
          label="Confirmed paid"
          value={cedis(paidWeek)}
          sub="Admin-approved pieces"
          icon={<CheckCircle2 />}
        />
        <Link href="/student/billing" className="block">
          <PixelCard className="flex h-full flex-col justify-center gap-2 p-5 transition hover:border-teal-600">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/45">
              Payments
            </p>
            <p className="text-sm font-black uppercase tracking-wide text-teal-950 dark:text-white">
              {paidFull ? "You’re clear this week" : "Submit payment proof"}
            </p>
            <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
              Open billing →
            </p>
          </PixelCard>
        </Link>
      </div>

      {/* Active appliance */}
      <PixelCard bolts className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          <div className="relative flex items-center justify-center border-b-2 border-teal-900/25 bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] p-6 dark:border-teal-100/20 dark:from-[#0f2d2b] dark:to-[#04100f] md:border-b-0 md:border-r-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/machine.webp"
              alt="Washing machine"
              className="h-40 w-auto object-contain md:h-44"
            />
            <PixelBadge
              tone={inHand ? "teal" : "slate"}
              className="absolute left-3 top-3"
            >
              <span
                className={`h-1.5 w-1.5 ${
                  inHand
                    ? "animate-pulse bg-teal-600 dark:bg-teal-300"
                    : "bg-teal-900/40"
                }`}
              />
              {inHand
                ? "In your hands"
                : rotation?.isHereNow
                  ? "In your room"
                  : "Not here yet"}
            </PixelBadge>
          </div>

          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  {inHand ? "Active session" : "Your machine"}
                </p>
                <p className="mt-1 text-sm font-black tracking-wide text-teal-950 dark:text-white">
                  {machineLabel}
                </p>
                {rotation?.currentRoom && !inHand && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-teal-900/50">
                    <MapPin className="h-3 w-3" />
                    Now in Room {rotation.currentRoom.number}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  {rotation
                    ? `Room ${rotation.myRoom.number}${
                        rotation.hall ? ` · ${rotation.hall.code}` : ""
                      }`
                    : me?.student?.roomNumber
                      ? `Room ${me.student.roomNumber}`
                      : "Unassigned"}
                </p>
                {inHand &&
                  active?.minutesLate != null &&
                  active.minutesLate > 0 && (
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      {formatMins(active.minutesLate)} late
                    </p>
                  )}
              </div>
            </div>

            <div className="space-y-4">
              {rotation || inHand ? (
                <CountdownBoxes
                  totalMs={countdown.totalMs}
                  label={countdown.label}
                  sublabel={
                    inHand
                      ? "until handoff"
                      : countdown.done
                        ? "your turn now — scan the machine"
                        : "until your turn"
                  }
                  windowHours={inHand ? 24 : 48}
                  segments={24}
                />
              ) : (
                <div>
                  <p className="text-5xl font-black tabular-nums text-teal-900/25 sm:text-6xl">
                    —
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                    no schedule
                  </p>
                </div>
              )}
              {inHand && active && <SessionProgress active={active} />}
              {!rotation && !loading && (
                <p className="text-[11px] font-semibold text-teal-900/50">
                  Your room is not on a machine rotation yet. Admin sets this on
                  the Rotation page.
                </p>
              )}
            </div>
          </div>
        </div>
      </PixelCard>

      {/* Notification nudge */}
      {hasStudent && pushSupported && !pushOn && (
        <PixelCard className="flex flex-wrap items-center justify-between gap-3 border-2 border-teal-600/30 bg-teal-600/5 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
              Turn on app alerts
            </p>
            <p className="mt-1 text-[11px] font-semibold text-teal-900/55 dark:text-teal-100/55">
              Get free push reminders before your wash day (saves SMS).
            </p>
          </div>
          <PixelButton
            size="sm"
            type="button"
            onClick={async () => {
              const res = await pushSubscribe();
              if (res.ok) toast.success("Push alerts enabled on this device.");
              else toast.error(res.error || "Could not enable push.");
            }}
          >
            Enable push
          </PixelButton>
        </PixelCard>
      )}

      {/* Week schedule */}
      {slots.length > 0 && (
        <div className="space-y-3">
          <SectionTitle text="YOUR WASH DAYS" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {slots.map((s) => (
              <PixelCard key={`${s.dayOfWeek}-${s.startTime}`} className="p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
                  {DAY_SHORT[s.dayOfWeek] ?? s.dayOfWeek.slice(0, 3)}
                </p>
                <p className="mt-1 font-mono text-sm font-black tabular-nums text-teal-700 dark:text-teal-300">
                  {s.startTime}
                </p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-teal-900/40">
                  Shared by room
                </p>
              </PixelCard>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-900/45">
            <CalendarDays className="h-3.5 w-3.5" />
            Room {rotation?.myRoom.number} — roommates share this schedule
          </p>
        </div>
      )}

      {/* Feedback */}
      <div className="mx-auto w-full max-w-lg">
        <PixelCard
          bolts
          className="relative flex min-h-[260px] flex-col justify-between gap-5 p-6 sm:p-8"
        >
          <div>
            <SectionTitle text="HOSTEL FEEDBACK" />
            <p className="mt-2 text-[11px] font-bold text-teal-900/50 dark:text-teal-100/50">
              {inHand
                ? "How was your laundry experience?"
                : "Scan the machine to check in and leave feedback."}
            </p>
          </div>

          <div className="flex min-h-[110px] flex-col items-center justify-center gap-3 border-2 border-teal-900/15 bg-teal-600/5 p-6 dark:border-teal-100/15 dark:bg-teal-400/5">
            {feedbackBusy ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            ) : feedbackRating ? (
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
            {(Object.keys(feedbackConfig) as FeedbackKey[]).map((type) => {
              const ButtonIcon = feedbackConfig[type].Icon;
              const isActive = feedbackRating === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!inHand || feedbackBusy}
                  aria-label={feedbackConfig[type].label}
                  onClick={() => void submitFeedback(type)}
                  className={`flex h-10 w-10 items-center justify-center border-2 transition-all duration-150 ${
                    isActive
                      ? "-translate-y-0.5 border-teal-950/60 bg-teal-600 text-white shadow-pixel-sm dark:border-teal-100/50 dark:bg-teal-500 dark:text-teal-950"
                      : "border-teal-900/20 bg-white text-teal-900/50 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-100/50"
                  } ${
                    inHand
                      ? "cursor-pointer hover:border-teal-900/50"
                      : "cursor-not-allowed opacity-50"
                  }`}
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

      {/* Faults */}
      <div className="space-y-4">
        <SectionTitle text="YOUR REPORTS" />
        <PixelCard className="divide-y-2 divide-teal-900/10 dark:divide-teal-100/10">
          {!faults || faults.length === 0 ? (
            <div className="flex items-center justify-center px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              No fault reports yet.
            </div>
          ) : (
            faults.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-teal-950 dark:text-white">
                    {f.title}
                  </p>
                  <p className="truncate text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                    {f.machine?.code || f.machine?.serialNumber || ""} ·{" "}
                    {f.severity}
                  </p>
                </div>
                <PixelBadge
                  tone={
                    f.status === "RESOLVED" || f.status === "CLOSED"
                      ? "green"
                      : "amber"
                  }
                >
                  {f.status}
                </PixelBadge>
              </div>
            ))
          )}
        </PixelCard>
      </div>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">
              Report machine fault
            </DialogTitle>
            <DialogDescription>
              Help us keep WeWash running. This reports on your assigned machine.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportFault} className="space-y-4 py-2">
            <div className="space-y-2">
              <PixelLabel>Machine</PixelLabel>
              <PixelInput value={machineLabel} disabled />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="issue">Issue summary</PixelLabel>
              <PixelInput
                id="issue"
                placeholder="e.g. Spin cycle is extremely noisy"
                value={faultTitle}
                onChange={(e) => setFaultTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="details">Detailed description</PixelLabel>
              <PixelTextarea
                id="details"
                placeholder="Explain what happened and any error codes shown..."
                value={faultDesc}
                onChange={(e) => setFaultDesc(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="severity">Severity</PixelLabel>
              <PixelSelect
                id="severity"
                value={faultSeverity}
                onChange={(e) => setFaultSeverity(e.target.value)}
              >
                <option value="LOW">Low (cosmetic / minor)</option>
                <option value="MEDIUM">Medium (noisy but washes)</option>
                <option value="HIGH">High (blocked drain / no spin)</option>
                <option value="CRITICAL">Critical (total breakdown)</option>
              </PixelSelect>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <PixelButton
                type="button"
                variant="outline"
                onClick={() => setIsReportOpen(false)}
              >
                Cancel
              </PixelButton>
              <PixelButton
                type="submit"
                variant="danger"
                disabled={submitting || !machineId}
              >
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
  const usedHours = Math.max(
    0,
    Math.min(totalHours, Math.round((now - start) / 3600000))
  );
  return (
    <>
      <SegmentBar
        value={usedHours}
        max={totalHours}
        segments={24}
        className="mt-4"
        label="Window used"
      />
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
