"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { BlockyText, FONT3, FONT5 } from "@/components/pixel/blocky-text";


const teal = "fill-teal-600 dark:fill-teal-400";
const tealDeep = "fill-teal-700 dark:fill-teal-300";

/* --------------------------------------------------------------------------
   Slides. "@" in `word` is the washing machine acting as a letter, so each
   slide's word (PAY / WHO / JOIN) is built the same way and sits in the same
   hero spot. `sub` lines are the supporting text underneath.
-------------------------------------------------------------------------- */

type Seg = { t: string; chunky?: boolean };

type Slide = {
  src: string;
  alt: string;
  word: string[]; // e.g. ["P", "@", "Y"]  ("@" = machine)
  sub: Seg[][]; // lines -> segments
  machineGap?: string;
};

const SLIDES: Slide[] = [
  {
    src: "/images/machine.webp",
    alt: "Washing machine",
    word: ["P", "@", "A", "Y"],
    sub: [[{ t: "LESS BY" }, { t: "SHARING", chunky: true }]],
  },
  {
    src: "/images/machine-open.webp",
    alt: "Open washing machine",
    word: ["W", "@", "H", "O"],
    sub: [[{ t: "STILL WASHES?" }], [{ t: "JUST TOSS YOUR CLOTHES IN" }]],
    machineGap: "calc(var(--word-gap) * 1.25)",
  },
  {
    src: "/images/machine-clothes.webp",
    alt: "Washing machine with clothes",
    word: ["J", "@", "O", "I", "N"],
    sub: [[{ t: "US, LIFE CAN BE EASIER" }]],
  },
];

// The word built from letters + the machine, either horizontal (landscape) or
// rotated to run top-to-bottom (portrait). The machine is never rotated.
function Wordmark({
  slide,
  vertical,
  letter,
  machine,
  gap,
}: {
  slide: Slide;
  vertical: boolean;
  letter: string; // CSS length: the letters' height (their "length" when rotated)
  machine: string; // CSS length: the machine's height
  gap: string; // even spacing between every letter / the machine
}) {
  return (
    <div
      className={`flex ${vertical ? "flex-col" : "flex-row"} items-center justify-center`}
      style={{ gap, "--word-gap": gap } as CSSProperties}
    >
      {slide.word.map((tok, i) =>
        tok === "@" ? (
          <img
            key={i}
            src={slide.src}
            alt={slide.alt}
            className="w-auto object-contain relative z-20"
            style={
              {
                height: machine,
                [vertical ? "marginBlock" : "marginInline"]: slide.machineGap,
              } as CSSProperties
            }
          />
        ) : vertical ? (
          <div
            key={i}
            className="flex items-center justify-center relative z-10"
            style={{ width: letter, height: `calc(${letter} * 0.6)` }}
          >
            <BlockyText text={tok} font={FONT3} className={`${teal} rotate-90`} style={{ height: letter }} />
          </div>
        ) : (
          <BlockyText
            key={i}
            text={tok}
            font={FONT3}
            className={`${teal} relative z-10`}
            style={{ height: letter }}
          />
        )
      )}
    </div>
  );
}

function Subs({
  slide,
  slim,
  chunk,
  gap,
  lineGap,
}: {
  slide: Slide;
  slim: string;
  chunk: string;
  gap: string;
  lineGap: string;
}) {
  return (
    <div className="flex flex-col items-center" style={{ gap: lineGap }}>
      {slide.sub.map((line, li) => (
        <div key={li} className="flex items-end justify-center" style={{ gap }}>
          {line.map((s, si) => (
            <BlockyText
              key={si}
              text={s.t}
              font={s.chunky ? FONT3 : FONT5}
              className={s.chunky ? teal : tealDeep}
              style={{ height: s.chunky ? chunk : slim, maxWidth: "92vw" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  // Landscape unit: big, capped so wide screens keep side space (trimmed first),
  // and capped by height so it never gets cut off.
  const U = "min(100vw, 1600px, 160vh)";
  const u = (k: number) => `calc(${U} * ${k})`;
  // Portrait unit: drives the rotated vertical wordmark.
  const M = "min(72vw, 16vh)";
  const m = (k: number) => `calc(${M} * ${k})`;

  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false); // dev: freeze on ?s=N
  const [count, setCount] = useState(0);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (s !== null) {
      const i = Number(s);
      if (i >= 0 && i < SLIDES.length) {
        setActive(i);
        setLocked(true);
        setLoaded(true); // dev: skip intro when a slide is pinned
        return;
      }
    }
    // Intro loader: fast count up 0 -> 100, then reveal.
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setLoaded(true), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (locked) return;
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, [locked]);

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] dark:from-[#0f2d2b] dark:to-[#04100f] text-slate-800 dark:text-slate-200 overflow-hidden select-none transition-colors duration-500">
      {/* Intro loader: centered logo, "ready?" bottom-left, 0-100 counter bottom-right */}
      <div
        className={`absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] dark:from-[#0f2d2b] dark:to-[#04100f] transition-opacity duration-700 ${
          loaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="flex-1 flex items-center justify-center">
          <img
            src="/favicon.ico"
            alt="WeWash"
            className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
          />
        </div>
        <div className="flex items-end justify-between px-6 pb-6 sm:px-10 sm:pb-10">
          <BlockyText
            text="READY?"
            font={FONT3}
            className={teal}
            style={{ height: "clamp(16px, 3vw, 32px)" }}
          />
          <BlockyText
            text={String(count)}
            font={FONT3}
            className={teal}
            style={{ height: "clamp(30px, 8vw, 88px)" }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
        <img src="/favicon.ico" alt="WeWash Logo" className="h-9 w-9 sm:h-11 sm:w-11 object-contain" />
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/contact"
            className="text-sm sm:text-base font-semibold text-teal-800 dark:text-teal-100 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/signup"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm sm:text-base font-semibold px-3.5 py-2 sm:px-5 sm:py-2.5 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="w-screen h-screen">
        {/* ===================== LANDSCAPE ===================== */}
        <div className="portrait:hidden relative w-full h-full">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${
                i === active ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Wordmark slide={slide} vertical={false} letter={u(0.24)} machine={u(0.28)} gap={u(0.02)} />
              <div style={{ marginTop: u(0.055) }}>
                <Subs slide={slide} slim={u(0.042)} chunk={u(0.055)} gap={u(0.015)} lineGap={u(0.02)} />
              </div>
            </div>
          ))}
        </div>

        {/* ===================== PORTRAIT ===================== */}
        <div className="hidden portrait:block relative w-full h-full">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${
                i === active ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Wordmark slide={slide} vertical letter={M} machine={M} gap={m(0.1)} />
              <div style={{ marginTop: "5vh" }}>
                <Subs slide={slide} slim="3.4vw" chunk="4.6vw" gap="1.4vw" lineGap="1.2vh" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Slide indicator dots */}
      <div className="absolute bottom-5 inset-x-0 z-30 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => {
              setActive(i);
              setLocked(true);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-teal-600 dark:bg-teal-400" : "w-2 bg-teal-600/40 dark:bg-teal-400/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
