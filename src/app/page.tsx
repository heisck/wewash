"use client";

import { useState } from "react";

export default function Home() {
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  
  // Total of 24 logical slots. We skip 11, 16, and 17 because box 10 spans 2x2.
  const boxesToRender = [
    1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 12,
    13, 14, 15, 18,
    19, 20, 21, 22, 23, 24
  ];

  const toggleSelectBox = (num: number) => {
    if (selectedBoxes.includes(num)) {
      setSelectedBoxes((prev) => prev.filter((id) => id !== num));
    } else {
      setSelectedBoxes((prev) => [...prev, num]);
    }
  };

  const renderBox = (num: number) => {
    // Box 1 is the brand logo box
    if (num === 1) {
      return (
        <div
          key={num}
          className="relative w-full h-full flex items-center justify-center bg-transparent opacity-100"
        >
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5">
            <img 
              src="/favicon.ico" 
              alt="WeWash Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain" 
            />
          </div>
        </div>
      );
    }

    // Box 10 is the washing machine image box spanning 2 columns and 2 rows
    if (num === 10) {
      return (
        <div
          key={num}
          className="col-span-2 row-span-2 relative w-full h-full flex items-center justify-center p-1 bg-transparent opacity-100 z-20"
        >
          {/* Inner relative container with responsive scaling */}
          <div className="relative w-full h-full flex items-center justify-center scale-[1.1] sm:scale-[1.25] md:scale-[1.35]">
            <img 
              src="/images/machine.webp" 
              alt="Washing Machine" 
              className="w-full h-full object-contain z-20 relative" 
            />
          </div>
        </div>
      );
    }

    // Box 15 is the blocky 'P' box adjacent to the washing machine
    if (num === 15) {
      return (
        <div
          key={num}
          className="relative w-full h-full flex items-end justify-end bg-transparent opacity-100 p-0 z-10"
        >
          <svg 
            viewBox="0 0 60 100" 
            className="h-[80%] sm:h-[110%] md:h-[133.33%] aspect-[60/100] fill-teal-600 dark:fill-teal-400 z-10 relative origin-bottom-right translate-x-[45%] sm:translate-x-[65%] md:translate-x-[90%]"
          >
            <path 
              fillRule="evenodd" 
              d="M 0 0 H 60 V 60 H 20 V 100 H 0 V 0 Z M 20 20 H 40 V 40 H 20 V 20 Z" 
            />
          </svg>
        </div>
      );
    }

    // Box 18 is the second 'P' and 'y' on the right side of the washing machine
    if (num === 18) {
      return (
        <div
          key={num}
          className="relative w-full h-full flex items-end justify-start bg-transparent opacity-100 p-0 z-10"
        >
          {/* The Mirrored P */}
          <svg 
            viewBox="0 0 60 100" 
            className="absolute left-0 h-[80%] sm:h-[110%] md:h-[133.33%] aspect-[60/100] fill-teal-600 dark:fill-teal-400 z-10 origin-bottom-left translate-x-[10%] sm:translate-x-[12%] md:translate-x-[15%] scale-x-[-1]"
          >
            <path 
              fillRule="evenodd" 
              d="M 0 0 H 60 V 60 H 20 V 100 H 0 V 0 Z M 20 20 H 40 V 40 H 20 V 20 Z" 
            />
          </svg>

          {/* The Blocky 'y' - positioned from the right edge so it never overflows the viewport */}
          <svg 
            viewBox="0 0 60 100" 
            className="absolute right-[5%] h-[80%] sm:h-[110%] md:h-[133.33%] aspect-[60/100] fill-teal-600 dark:fill-teal-400 z-10 origin-bottom-right"
          >
            <path 
              fillRule="evenodd" 
              d="M 0 0 H 20 V 40 H 40 V 0 H 60 V 100 H 40 V 60 H 0 Z" 
            />
          </svg>
        </div>
      );
    }

    // Normal numbered box (now empty/scaffolding hidden)
    return (
      <div
        key={num}
        className="w-full h-full bg-transparent"
      />
    );
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] dark:from-[#0f2d2b] dark:to-[#04100f] text-slate-800 dark:text-slate-200 overflow-hidden select-none transition-colors duration-500">
      {/* 
        Grid container:
        - Fixed 6 columns x 4 rows layout to maintain a perfect single-page layout
        - Box 10 spans 2x2 (occupying positions 10, 11, 16, 17)
      */}
      <div className="grid grid-cols-6 grid-rows-4 gap-0 w-full h-full">
        {boxesToRender.map(renderBox)}
      </div>
    </div>
  );
}
