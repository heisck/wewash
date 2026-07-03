"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BlockyText, FONT3, FONT5 } from "./blocky-text";

/* --------------------------------------------------------------------------
   Auth scaffold: same stage as the landing hero — mint gradient, a blocky
   wordmark where the washing machine stands in for a letter ("@"), and the
   form riding below on a hard-shadow panel.
-------------------------------------------------------------------------- */

export function AuthFrame({
  word,
  sub,
  machineSrc = "/images/machine.webp",
  machineAlt = "Washing machine",
  children,
  footer,
}: {
  word: string; // "@" = machine, e.g. "L@GIN"
  sub: string;
  machineSrc?: string;
  machineAlt?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const tokens = word.split("");
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] text-slate-800 transition-colors duration-500 dark:from-[#0f2d2b] dark:to-[#04100f] dark:text-slate-200">
      {/* Header */}
      <header className="z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="flex items-center" aria-label="WeWash home">
          <img src="/favicon.ico" alt="WeWash" className="h-9 w-9 object-contain sm:h-11 sm:w-11" />
        </Link>
        <Link
          href="/"
          className="border-2 border-teal-900/30 bg-white/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-teal-900 shadow-pixel-sm transition-all hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-pixel-none dark:border-teal-100/30 dark:bg-teal-950/40 dark:text-teal-100"
        >
          Back home
        </Link>
      </header>

      {/* Stage */}
      <main className="z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-6">
        {/* Wordmark: letters + the machine standing in as a letter */}
        <div
          className="flex items-center justify-center"
          style={{ gap: "clamp(8px, 1.8vw, 18px)" }}
        >
          {tokens.map((tok, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: "easeOut" }}
            >
              {tok === "@" ? (
                <img
                  src={machineSrc}
                  alt={machineAlt}
                  className="w-auto object-contain"
                  style={{ height: "clamp(60px, 11vw, 104px)" }}
                />
              ) : (
                <BlockyText
                  text={tok}
                  font={FONT3}
                  className="fill-teal-600 dark:fill-teal-400"
                  style={{ height: "clamp(48px, 9vw, 88px)" }}
                />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-6"
        >
          <BlockyText
            text={sub}
            font={FONT5}
            className="fill-teal-700 dark:fill-teal-300"
            style={{ height: "clamp(9px, 1.6vw, 13px)", maxWidth: "88vw" }}
          />
        </motion.div>

        {/* Form panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
          className="mt-10 w-full max-w-[420px]"
        >
          {children}
        </motion.div>

        {footer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 flex flex-col items-center gap-4 text-center"
          >
            {footer}
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* Shared Google sign-in glyph */
export function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}
