"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to a target time. Ticks every second and returns the remaining
 * pieces plus a compact human label (e.g. "14h 03m", "42m 10s", "Now").
 */
export function useCountdown(target: string | Date | null) {
  const targetMs = target ? new Date(target).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (targetMs == null) {
    return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, done: true, label: "—" };
  }

  const totalMs = Math.max(0, targetMs - now);
  const totalSec = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const done = totalMs <= 0;

  let label: string;
  if (done) label = "Now";
  else if (hours > 0) label = `${hours}h ${String(minutes).padStart(2, "0")}m`;
  else if (minutes > 0) label = `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  else label = `${seconds}s`;

  return { totalMs, hours, minutes, seconds, done, label };
}
