"use client";

import { useEffect, useState } from "react";

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Countdown from an absolute end timestamp (ms).
 * Returns remaining seconds, MM:SS label, and done flag.
 */
export function useSecondsCountdown(endsAtMs: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAtMs == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAtMs]);

  if (endsAtMs == null) {
    return {
      secondsLeft: 0,
      label: "00:00",
      done: true,
      active: false,
    };
  }

  const secondsLeft = Math.max(0, Math.ceil((endsAtMs - now) / 1000));
  return {
    secondsLeft,
    label: formatMmSs(secondsLeft),
    done: secondsLeft <= 0,
    active: secondsLeft > 0,
  };
}

/** Human label for a duration in seconds (e.g. 10 min cooldown copy). */
export function formatDurationMinutes(seconds: number): string {
  const m = Math.ceil(seconds / 60);
  return m === 1 ? "1 minute" : `${m} minutes`;
}
