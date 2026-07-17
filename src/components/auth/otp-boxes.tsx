"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AUTH_OTP } from "@/lib/config/constants";

type OtpBoxesProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Six (or N) individual digit boxes for OTP entry.
 * Supports paste, backspace navigation, and arrow keys.
 */
export function OtpBoxes({
  value,
  onChange,
  length = AUTH_OTP.LENGTH,
  disabled = false,
  id = "otp",
  autoFocus = true,
  className,
  "aria-label": ariaLabel = "One-time code",
}: OtpBoxesProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const chars = value.replace(/\D/g, "").slice(0, length).split("");
    return Array.from({ length }, (_, i) => chars[i] ?? "");
  }, [value, length]);

  const setDigitAt = (index: number, digit: string) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join("").replace(/\D/g, "").slice(0, length));
  };

  const focusAt = (index: number) => {
    const el = inputsRef.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigitAt(index, "");
      return;
    }

    // Paste or multi-digit input into one box → fill remaining
    if (cleaned.length > 1) {
      const next = [...digits];
      for (let i = 0; i < cleaned.length && index + i < length; i++) {
        next[index + i] = cleaned[i]!;
      }
      onChange(next.join("").slice(0, length));
      focusAt(Math.min(length - 1, index + cleaned.length - 1));
      return;
    }

    setDigitAt(index, cleaned);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        setDigitAt(index - 1, "");
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(length - 1, pasted.length - 1));
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex w-full items-center justify-between gap-1.5 sm:gap-2", className)}
    >
      {digits.map((digit, index) => (
        <input
          key={`${id}-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={index === 0 ? id : `${id}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          maxLength={length}
          disabled={disabled}
          value={digit}
          aria-label={`Digit ${index + 1} of ${length}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-12 w-full max-w-12 border-2 border-teal-900/30 bg-white text-center text-lg font-black tabular-nums text-teal-950 outline-none transition-all",
            "focus:border-teal-600 focus:shadow-pixel-sm",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-teal-100/25 dark:bg-teal-950/40 dark:text-teal-50 dark:focus:border-teal-400",
            digit && "border-teal-600 dark:border-teal-400"
          )}
        />
      ))}
    </div>
  );
}
