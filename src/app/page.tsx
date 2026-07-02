"use client";

import { useState } from "react";

export default function Home() {
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  
  // Total of 24 boxes to fit the grid layouts exactly
  const boxCount = 24;
  const boxes = Array.from({ length: boxCount }, (_, i) => i + 1);

  const toggleSelectBox = (num: number) => {
    if (selectedBoxes.includes(num)) {
      setSelectedBoxes((prev) => prev.filter((id) => id !== num));
    } else {
      setSelectedBoxes((prev) => [...prev, num]);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] dark:from-[#0f2d2b] dark:to-[#04100f] text-slate-800 dark:text-slate-200 overflow-hidden select-none transition-colors duration-500">
      {/* 
        Grid container:
        - 100% viewport width and height (h-full w-full)
        - No gap (gap-0)
        - Edge-to-edge border logic with teal-tinted borders
        - Grid layout adjusts based on screen size to keep boxes as close to square as possible:
          - Desktop (lg): 6 columns x 4 rows
          - Tablet (md): 4 columns x 6 rows
          - Mobile (default): 3 columns x 8 rows
      */}
      <div className="grid grid-cols-3 grid-rows-8 md:grid-cols-4 md:grid-rows-6 lg:grid-cols-6 lg:grid-rows-4 gap-0 border-t border-l border-teal-900/15 dark:border-teal-800/20 w-full h-full">
        {boxes.map((num) => {
          const isSelected = selectedBoxes.includes(num);
          return (
            <div
              key={num}
              onClick={() => toggleSelectBox(num)}
              className={`
                group flex items-center justify-center relative border-r border-b border-teal-900/15 dark:border-teal-800/20 transition-all duration-300 cursor-pointer overflow-hidden h-full w-full
                ${
                  num === 1
                    ? isSelected
                      ? "bg-teal-500/10 dark:bg-teal-400/15 opacity-100"
                      : "bg-white/10 dark:bg-slate-900/10 opacity-100"
                    : isSelected
                    ? "bg-teal-500/10 dark:bg-teal-400/15"
                    : "bg-white/5 dark:bg-slate-900/5 opacity-40 dark:opacity-35 hover:opacity-100 hover:bg-white/20 dark:hover:bg-slate-850/25"
                }
              `}
            >
              {/* Top-right subtle pulse indicator for selected boxes */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-pulse" />
              )}

              {/* Box Content: Favicon Logo for Box 1, Number for other boxes */}
              {num === 1 ? (
                <div className="absolute top-4 left-4 sm:top-5 sm:left-5 transition-transform duration-300 group-hover:scale-105">
                  <img 
                    src="/favicon.ico" 
                    alt="WeWash Logo" 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain" 
                  />
                </div>
              ) : (
                <span
                  className={`
                    text-3xl sm:text-4xl md:text-5xl font-black font-mono transition-all duration-300 tracking-tighter
                    ${
                      isSelected
                        ? "text-teal-600 dark:text-teal-400 scale-105"
                        : "text-teal-950/40 dark:text-teal-200/35 group-hover:text-teal-950 dark:group-hover:text-white"
                    }
                  `}
                >
                  {num}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
