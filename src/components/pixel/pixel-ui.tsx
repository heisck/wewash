"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { BlockyText, FONT3, FONT5 } from "./blocky-text";

/* --------------------------------------------------------------------------
   WeWash pixel design system.
   Everything is boxy: 2px borders, hard offset shadows, zero border-radius.
   Interactions "press" into the page (translate + shadow collapse) the way a
   physical arcade button would.
-------------------------------------------------------------------------- */

/* ─── Button ─── */

type PixelButtonVariant = "primary" | "dark" | "outline" | "danger" | "ghost";
type PixelButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<PixelButtonVariant, string> = {
  primary:
    "bg-teal-600 border-teal-950/80 text-white hover:bg-teal-500 dark:bg-teal-500 dark:border-teal-100/60 dark:text-teal-950 dark:hover:bg-teal-400",
  dark: "bg-teal-950 border-teal-950 text-teal-50 hover:bg-teal-900 dark:bg-teal-100 dark:border-teal-100 dark:text-teal-950 dark:hover:bg-white",
  outline:
    "bg-white/80 border-teal-900/40 text-teal-950 hover:bg-white hover:border-teal-700 dark:bg-teal-950/40 dark:border-teal-100/30 dark:text-teal-100 dark:hover:bg-teal-900/60",
  danger:
    "bg-rose-600 border-rose-950/70 text-white hover:bg-rose-500 dark:border-rose-200/50",
  ghost:
    "border-transparent shadow-none text-teal-900 hover:bg-teal-900/10 dark:text-teal-100 dark:hover:bg-teal-100/10",
};

const buttonSizes: Record<PixelButtonSize, string> = {
  sm: "h-8 px-3 text-[10px] gap-1.5",
  md: "h-10 px-4 text-[11px] gap-2",
  lg: "h-12 px-6 text-xs gap-2.5",
};

export function PixelButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 cursor-pointer select-none items-center justify-center border-2 font-black uppercase tracking-widest transition-all duration-100",
        variant !== "ghost" &&
          "shadow-pixel-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-pixel active:translate-x-[3px] active:translate-y-[3px] active:shadow-pixel-none",
        "disabled:pointer-events-none disabled:opacity-50",
        buttonSizes[size],
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

/* ─── Square icon button ─── */

export function PixelIconButton({
  className,
  alert,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { alert?: boolean }) {
  return (
    <button
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-teal-900/40 bg-white/80 text-teal-900 shadow-pixel-sm transition-all duration-100 hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-pixel-none dark:border-teal-100/30 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-900/60",
        className
      )}
      {...props}
    >
      {props.children}
      {alert && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-rose-500" aria-hidden="true" />
      )}
    </button>
  );
}

/* ─── Card / Panel ─── */

export function PixelCard({
  className,
  bolts = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { bolts?: boolean }) {
  return (
    <div
      className={cn(
        "relative border-2 border-teal-900/25 bg-white shadow-pixel dark:border-teal-100/20 dark:bg-[#07201e]",
        className
      )}
      {...props}
    >
      {bolts && (
        <>
          <span className="pointer-events-none absolute left-1.5 top-1.5 h-1 w-1 bg-teal-900/30 dark:bg-teal-100/30" />
          <span className="pointer-events-none absolute right-1.5 top-1.5 h-1 w-1 bg-teal-900/30 dark:bg-teal-100/30" />
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 h-1 w-1 bg-teal-900/30 dark:bg-teal-100/30" />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-1 w-1 bg-teal-900/30 dark:bg-teal-100/30" />
        </>
      )}
      {children}
    </div>
  );
}

/* ─── Input ─── */

export const pixelInputClass =
  "h-11 w-full border-2 border-teal-900/30 bg-white px-3 text-sm font-semibold text-teal-950 outline-none transition-all placeholder:font-semibold placeholder:text-teal-900/35 focus:border-teal-600 focus:shadow-pixel-sm disabled:opacity-60 disabled:bg-teal-900/5 dark:border-teal-100/25 dark:bg-teal-950/40 dark:text-teal-50 dark:placeholder:text-teal-100/30 dark:focus:border-teal-400 dark:disabled:bg-teal-100/5";

export function PixelInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(pixelInputClass, className)} {...props} />;
}

export function PixelTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(pixelInputClass, "h-auto min-h-[90px] py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function PixelSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(pixelInputClass, "appearance-none pr-9 cursor-pointer", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 7 4"
        shapeRendering="crispEdges"
        className="pointer-events-none absolute right-3 top-1/2 h-2 w-3.5 -translate-y-1/2 fill-teal-900/60 dark:fill-teal-100/60"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="7" height="1" />
        <rect x="1" y="1" width="5" height="1" />
        <rect x="2" y="2" width="3" height="1" />
        <rect x="3" y="3" width="1" height="1" />
      </svg>
    </div>
  );
}

/* ─── Micro label ─── */

export function PixelLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-[10px] font-black uppercase tracking-widest text-teal-900/60 dark:text-teal-100/60",
        className
      )}
      {...props}
    />
  );
}

/* ─── Badge ─── */

type PixelBadgeTone = "teal" | "green" | "amber" | "red" | "slate";

const badgeTones: Record<PixelBadgeTone, string> = {
  teal: "border-teal-700/50 bg-teal-600/10 text-teal-700 dark:border-teal-300/40 dark:bg-teal-400/10 dark:text-teal-300",
  green:
    "border-emerald-700/50 bg-emerald-600/10 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  amber:
    "border-amber-700/50 bg-amber-500/10 text-amber-700 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-300",
  red: "border-rose-700/50 bg-rose-600/10 text-rose-700 dark:border-rose-300/40 dark:bg-rose-400/10 dark:text-rose-300",
  slate:
    "border-teal-900/30 bg-teal-900/5 text-teal-900/70 dark:border-teal-100/25 dark:bg-teal-100/5 dark:text-teal-100/70",
};

export function PixelBadge({
  tone = "teal",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: PixelBadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
        badgeTones[tone],
        className
      )}
      {...props}
    />
  );
}

/* ─── Segmented progress bar (pixel blocks) ─── */

export function SegmentBar({
  value,
  max,
  segments = 20,
  className,
  tone = "teal",
  label = "Progress",
}: {
  value: number;
  max: number;
  segments?: number;
  className?: string;
  tone?: "teal" | "amber" | "red";
  label?: string;
}) {
  const filled = Math.round((Math.min(value, max) / max) * segments);
  const fillClass =
    tone === "amber"
      ? "bg-amber-500"
      : tone === "red"
        ? "bg-rose-500"
        : "bg-teal-600 dark:bg-teal-400";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("flex h-3 w-full gap-[3px]", className)}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-full flex-1",
            i < filled ? fillClass : "bg-teal-900/15 dark:bg-teal-100/15"
          )}
        />
      ))}
    </div>
  );
}

/* ─── Toggle (square switch) ─── */

export function PixelToggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-12 shrink-0 cursor-pointer border-2 transition-colors duration-150",
        enabled
          ? "border-teal-950/70 bg-teal-600 dark:border-teal-100/50 dark:bg-teal-500"
          : "border-teal-900/30 bg-teal-900/10 dark:border-teal-100/25 dark:bg-teal-100/10"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 h-4 w-4 -translate-y-1/2 bg-white shadow-[1px_1px_0_rgba(0,0,0,0.25)] transition-all duration-150 dark:bg-teal-950",
          enabled ? "left-[26px] dark:bg-white" : "left-0.5"
        )}
      />
    </button>
  );
}

/* ─── Headings ─── */

export function PageTitle({
  text,
  sub,
  className,
}: {
  text: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <h1 className="sr-only">{text}</h1>
      <BlockyText
        text={text}
        font={FONT3}
        className="fill-teal-700 dark:fill-teal-300"
        style={{ height: "clamp(18px, 3vw, 24px)" }}
      />
      {sub && (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/50 dark:text-teal-100/50">
          {sub}
        </p>
      )}
    </div>
  );
}

export function SectionTitle({
  text,
  right,
  className,
}: {
  text: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex items-end gap-3">
        <span className="mb-[3px] block h-2 w-2 bg-teal-600 dark:bg-teal-400" aria-hidden="true" />
        <h2 className="sr-only">{text}</h2>
        <BlockyText
          text={text}
          font={FONT5}
          className="fill-teal-950 dark:fill-teal-50"
          style={{ height: "13px" }}
        />
      </div>
      {right}
    </div>
  );
}

/* ─── Stat tile ─── */

export function StatTile({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <PixelCard className={cn("flex min-h-[104px] flex-col justify-between p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/50 dark:text-teal-100/50">
          {label}
        </span>
        {icon && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300 [&>svg]:h-3 [&>svg]:w-3">
            {icon}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-black leading-none text-teal-950 dark:text-white sm:text-2xl">
          {value}
        </p>
        {sub && (
          <div className="mt-1.5 truncate text-[9px] font-bold uppercase tracking-wider text-teal-900/50 dark:text-teal-100/50">
            {sub}
          </div>
        )}
      </div>
    </PixelCard>
  );
}

/* ─── Pixel washing machine mark (brand icon, pure rects) ─── */

export function MachineMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 11 12"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* frame */}
      <rect x="0" y="0" width="11" height="1" />
      <rect x="0" y="11" width="11" height="1" />
      <rect x="0" y="0" width="1" height="12" />
      <rect x="10" y="0" width="1" height="12" />
      {/* control panel */}
      <rect x="2" y="2" width="2" height="1" />
      <rect x="7" y="2" width="2" height="1" />
      {/* drum ring */}
      <rect x="3" y="5" width="5" height="1" />
      <rect x="3" y="9" width="5" height="1" />
      <rect x="2" y="6" width="1" height="3" />
      <rect x="8" y="6" width="1" height="3" />
      {/* agitator pixel */}
      <rect x="5" y="7" width="1" height="1" />
    </svg>
  );
}

/* ─── Table primitives ─── */

export function PixelTh({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 pb-2.5 text-left text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/50 dark:text-teal-100/50",
        className
      )}
      {...props}
    />
  );
}

export function PixelTd({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-3 text-xs font-semibold text-teal-950 dark:text-teal-50",
        className
      )}
      {...props}
    />
  );
}
