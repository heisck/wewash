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
    <div className="w-screen h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden select-none transition-colors duration-500">
      {/* 
        Grid container:
        - 100% viewport width and height (h-full w-full)
        - No gap (gap-0)
        - Edge-to-edge border logic
        - Grid layout adjusts based on screen size to keep boxes as close to square as possible:
          - Desktop (lg): 6 columns x 4 rows
          - Tablet (md): 4 columns x 6 rows
          - Mobile (default): 3 columns x 8 rows
      */}
      <div className="grid grid-cols-3 grid-rows-8 md:grid-cols-4 md:grid-rows-6 lg:grid-cols-6 lg:grid-rows-4 gap-0 border-t border-l border-slate-300 dark:border-slate-800 w-full h-full">
        {boxes.map((num) => {
          const isSelected = selectedBoxes.includes(num);
          return (
            <div
              key={num}
              onClick={() => toggleSelectBox(num)}
              className={`
                group flex items-center justify-center relative border-r border-b border-slate-300 dark:border-slate-800 transition-all duration-300 cursor-pointer overflow-hidden h-full w-full
                ${
                  isSelected
                    ? "bg-blue-500/10 dark:bg-blue-500/15"
                    : "bg-slate-100/10 dark:bg-slate-900/10 opacity-40 dark:opacity-35 hover:opacity-100 hover:bg-slate-200/20 dark:hover:bg-slate-800/25"
                }
              `}
            >
              {/* Top-right subtle pulse indicator for selected boxes */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
              )}

              {/* Number Label */}
              <span
                className={`
                  text-3xl sm:text-4xl md:text-5xl font-black font-mono transition-all duration-300 tracking-tighter
                  ${
                    isSelected
                      ? "text-blue-600 dark:text-blue-400 scale-105"
                      : "text-slate-400/80 dark:text-slate-600/80 group-hover:text-slate-900 dark:group-hover:text-white"
                  }
                `}
              >
                {num}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
