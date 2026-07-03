"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import { toast } from "sonner";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

import {
  ScanLine, Smile, Meh, Frown, Heart, Star, MessageSquare,
  Wrench, CreditCard, FileSignature, TicketCheck,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BlockyText, FONT3 } from "@/components/pixel/blocky-text";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel,
  PixelSelect, PixelTextarea, SectionTitle, SegmentBar,
} from "@/components/pixel/pixel-ui";

const HOURS_USED = 10;
const WINDOW_HOURS = 24;

export default function StudentDashboard() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [faultTitle, setFaultTitle] = useState("");
  const [faultDesc, setFaultDesc] = useState("");
  const [faultSeverity, setFaultSeverity] = useState("MEDIUM");
  const [faultMachine, setFaultMachine] = useState("WEWASH-W01-ATL");
  const [recentActivities, setRecentActivities] = useState([
    { title: "Weekly Dues Paid", detail: "GHS 35.00 via Mobile Money", date: "Today, 10:15 AM", icon: CreditCard },
    { title: "Setup Fee Paid", detail: "GHS 50.00 manual registration", date: "Oct 1, 2026", icon: CreditCard },
    { title: "Washing Contract Signed", detail: "Valid for Fall Semester 2026", date: "Oct 1, 2026", icon: FileSignature },
  ]);
  const [feedbackRating, setFeedbackRating] = useState<"frown" | "meh" | "smile" | "heart" | "star">("smile");
  const [isFeedbackCollapsed, setIsFeedbackCollapsed] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    if (isFeedbackCollapsed) {
      gsap.to(cardRef.current, {
        height: 0,
        opacity: 0,
        scale: 0.95,
        y: 16,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          if (cardRef.current) cardRef.current.style.display = "none";
        },
      });
      gsap.fromTo(
        tabRef.current,
        { opacity: 0, scale: 0, x: 50 },
        {
          display: "flex",
          opacity: 1,
          scale: 1,
          x: 0,
          duration: 0.4,
          delay: 0.2,
          ease: "back.out(1.5)",
          pointerEvents: "auto",
        }
      );
    } else {
      gsap.to(tabRef.current, {
        opacity: 0,
        scale: 0,
        x: 50,
        duration: 0.3,
        ease: "power2.inOut",
        pointerEvents: "none",
        onComplete: () => {
          if (tabRef.current) tabRef.current.style.display = "none";
        },
      });
      if (cardRef.current) {
        cardRef.current.style.display = "block";
        gsap.to(cardRef.current, {
          height: "auto",
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: "back.out(1.2)",
        });
      }
    }
  }, [isFeedbackCollapsed]);

  useGSAP(() => {
    if (tabRef.current) {
      Draggable.create(tabRef.current, {
        type: "y",
        bounds: window,
        edgeResistance: 0.65,
        onClick: () => {
          setIsFeedbackCollapsed(false);
        },
      });
    }
  }, []);

  const feedbackConfig = {
    frown: { Icon: Frown, label: "COULD BE BETTER", active: "bg-rose-500 border-rose-950/60 text-white" },
    meh: { Icon: Meh, label: "JUST OKAY", active: "bg-amber-500 border-amber-950/60 text-white" },
    smile: { Icon: Smile, label: "SMOOTH & CLEAN", active: "bg-teal-600 border-teal-950/60 text-white" },
    heart: { Icon: Heart, label: "LOVED THE SERVICE!", active: "bg-rose-400 border-rose-950/60 text-white" },
    star: { Icon: Star, label: "EXCELLENT EXPERIENCE!", active: "bg-yellow-400 border-yellow-950/60 text-yellow-950" },
  } as const;

  const activeFeedback = feedbackConfig[feedbackRating];
  const FeedbackIcon = activeFeedback.Icon;

  const handleReportFault = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Ticket sent — admin notified of "${faultTitle}" on ${faultMachine}.`);

    setRecentActivities([
      {
        title: "Fault Ticket Created",
        detail: `Reported: ${faultTitle} (${faultSeverity})`,
        date: "Just now",
        icon: Wrench,
      },
      ...recentActivities,
    ]);

    setFaultTitle("");
    setFaultDesc("");
    setIsReportOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* ─── Header row ─── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-end gap-4">
          {/* Date block */}
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
          <PageTitle text="TODAY" sub="Your window: Wed 8PM - Thu 8PM" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PixelButton variant="danger" onClick={() => setIsReportOpen(true)}>
            <Wrench className="h-3.5 w-3.5" />
            Report fault
          </PixelButton>
          <PixelButton onClick={() => toast.info("Opening QR scanner...")}>
            <ScanLine className="h-3.5 w-3.5" />
            Scan machine
          </PixelButton>
        </div>
      </div>

      {/* ─── Active appliance panel ─── */}
      <PixelCard bolts className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          {/* Machine portrait on gradient stage */}
          <div className="relative flex items-center justify-center border-b-2 border-teal-900/25 bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] p-6 dark:border-teal-100/20 dark:from-[#0f2d2b] dark:to-[#04100f] md:border-b-0 md:border-r-2">
            <img
              src="/images/machine.webp"
              alt="Your assigned washing machine"
              className="h-40 w-auto object-contain md:h-44"
            />
            <PixelBadge tone="teal" className="absolute left-3 top-3">
              <span className="h-1.5 w-1.5 animate-pulse bg-teal-600 dark:bg-teal-300" />
              In use today
            </PixelBadge>
          </div>

          {/* Countdown + stats */}
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  Active appliance
                </p>
                <p className="mt-1 text-sm font-black tracking-wide text-teal-950 dark:text-white">
                  WEWASH-W01-ATL
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  Room 104 - Group 1
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  Day 1 of 7
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-end gap-3">
                <BlockyText
                  text="14H"
                  font={FONT3}
                  className="fill-teal-600 dark:fill-teal-400"
                  style={{ height: "clamp(44px, 7vw, 64px)" }}
                />
                <span className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                  until 8PM handoff
                </span>
              </div>
              <SegmentBar
                value={HOURS_USED}
                max={WINDOW_HOURS}
                segments={24}
                className="mt-4"
              />
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">
                {HOURS_USED} of {WINDOW_HOURS} hours used
              </p>
            </div>

            {/* Week strip */}
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
                Rotation this week
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, i) => {
                  const isToday = i === 3;
                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center gap-1 border-2 px-1 py-1.5 text-center ${
                        isToday
                          ? "border-teal-950/70 bg-teal-600 text-white shadow-pixel-sm dark:border-teal-100/50 dark:bg-teal-500 dark:text-teal-950"
                          : "border-teal-900/15 bg-teal-900/5 text-teal-900/50 dark:border-teal-100/15 dark:bg-teal-100/5 dark:text-teal-100/50"
                      }`}
                    >
                      <span className="text-[8px] font-black tracking-widest">{day}</span>
                      <span className="text-[9px] font-black">{101 + i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* ─── Feedback ─── */}
      <div ref={cardRef} className="mx-auto w-full max-w-lg">
        <PixelCard bolts className="flex min-h-[320px] flex-col justify-between gap-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionTitle text="HOSTEL FEEDBACK" />
              <p className="mt-2 text-[11px] font-bold text-teal-900/50 dark:text-teal-100/50">
                How was your laundry experience today?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFeedbackCollapsed(true)}
              aria-label="Collapse feedback"
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border-2 border-teal-900/20 text-teal-900/50 transition-colors hover:border-teal-900/50 hover:text-teal-950 dark:border-teal-100/20 dark:text-teal-100/50 dark:hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="flex min-h-[130px] flex-col items-center justify-center gap-3 border-2 border-teal-900/15 bg-teal-600/5 p-6 dark:border-teal-100/15 dark:bg-teal-400/5">
            <FeedbackIcon
              className={`h-12 w-12 text-teal-600 transition-transform duration-300 dark:text-teal-400 ${
                feedbackRating === "smile" ? "animate-bounce" : "scale-110"
              }`}
            />
            <BlockyText
              text={activeFeedback.label}
              font={FONT3}
              className="fill-teal-950 dark:fill-teal-50"
              style={{ height: "10px" }}
            />
            <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              Feedback by John Doe
            </p>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            {(["frown", "meh", "smile", "heart", "star"] as const).map((type) => {
              const ButtonIcon = feedbackConfig[type].Icon;
              const isActive = feedbackRating === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-label={feedbackConfig[type].label}
                  onClick={() => setFeedbackRating(type)}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center border-2 transition-all duration-150 ${
                    isActive
                      ? `${feedbackConfig[type].active} -translate-y-0.5 shadow-pixel-sm`
                      : "border-teal-900/20 bg-white text-teal-900/50 hover:border-teal-900/50 hover:text-teal-900 dark:border-teal-100/20 dark:bg-teal-950/40 dark:text-teal-100/50 dark:hover:text-teal-100"
                  }`}
                >
                  <ButtonIcon className="h-4.5 w-4.5" />
                </button>
              );
            })}
          </div>
        </PixelCard>
      </div>

      {/* ─── Activity log ─── */}
      <div className="space-y-4">
        <SectionTitle text="ACTIVITY LOG" />
        <PixelCard className="divide-y-2 divide-teal-900/10 dark:divide-teal-100/10">
          {recentActivities.map((activity, i) => {
            const Icon = activity.icon ?? TicketCheck;
            return (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-teal-950 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="truncate text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                    {activity.detail}
                  </p>
                </div>
                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
                  {activity.date}
                </span>
              </div>
            );
          })}
        </PixelCard>
      </div>

      {/* ─── Floating collapsed feedback tab ─── */}
      <button
        ref={tabRef}
        type="button"
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 cursor-pointer items-center gap-2 border-2 border-r-0 border-teal-950/70 bg-teal-600 py-3 pl-3 pr-2.5 text-white shadow-pixel transition-colors hover:bg-teal-500 dark:border-teal-100/50 dark:bg-teal-500 dark:text-teal-950"
        style={{ display: "none", opacity: 0 }}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Feedback</span>
      </button>

      {/* ─── Report fault dialog ─── */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">
              Report machine fault
            </DialogTitle>
            <DialogDescription>
              Help us keep WeWash running. Submit details of the fault.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportFault} className="space-y-4 py-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="machine">Machine</PixelLabel>
              <PixelSelect
                id="machine"
                value={faultMachine}
                onChange={(e) => setFaultMachine(e.target.value)}
              >
                <option value="WEWASH-W01-ATL">WEWASH-W01-ATL (Floor 1 Group)</option>
                <option value="WEWASH-W02-ATL">WEWASH-W02-ATL (Floor 2 Group)</option>
              </PixelSelect>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="issue">Issue summary</PixelLabel>
              <PixelInput
                id="issue"
                placeholder="e.g. Spin cycle is extremely noisy, or water won't drain"
                value={faultTitle}
                onChange={(e) => setFaultTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="details">Detailed description</PixelLabel>
              <PixelTextarea
                id="details"
                placeholder="Please explain what happened and any error codes shown on the display..."
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
                <option value="LOW">Low (Cosmetic/minor delay)</option>
                <option value="MEDIUM">Medium (Vibrating/noise but washes)</option>
                <option value="HIGH">High (Blocked drain/incomplete spin)</option>
                <option value="CRITICAL">Critical (Total breakdown/no power)</option>
              </PixelSelect>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <PixelButton type="button" variant="outline" onClick={() => setIsReportOpen(false)}>
                Cancel
              </PixelButton>
              <PixelButton type="submit" variant="danger">
                Submit ticket
              </PixelButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
