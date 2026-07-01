"use client";

import Link from "next/link";
import Image from "next/image";
import { Droplet, RotateCw } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen lg:h-screen flex-col bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500 selection:text-white relative overflow-x-hidden justify-between">
      {/* Background Image Wrapper */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image 
          src="/images/wewash_bg.png" 
          alt="Atmospheric Landscape Background" 
          fill 
          className="object-cover pointer-events-none opacity-80 dark:opacity-30" 
          priority
        />
        <div className="absolute inset-0 bg-[#f8fafc]/40 dark:bg-[#0f172a]/80 backdrop-blur-[1px]" />
      </div>

      {/* Header */}
      <header className="w-full z-50">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 sm:px-12">
          <div className="flex items-center gap-2 font-bold text-base text-slate-800 dark:text-white uppercase tracking-wider">
            <Droplet className="h-5 w-5 text-blue-600 dark:text-blue-400 fill-current" />
            <span>Wewash</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            <Link href="/login" className="hover:text-blue-600 transition-colors">Portal</Link>
            <Link href="/student/guidelines" className="hover:text-blue-600 transition-colors">Guidelines</Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">Schedule</Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            <span>ENG</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link href="/login" className="hover:text-blue-600 transition-colors underline decoration-slate-400 underline-offset-4">
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-6 sm:px-12 flex-1 flex items-center py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full max-w-7xl mx-auto">
          
          {/* Left Column (Typography) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="font-serif text-slate-850 dark:text-white text-5xl sm:text-7xl lg:text-[5.8rem] font-bold tracking-tight uppercase leading-[0.9]">
              The Perfect <br /> Washer®
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase">
              / Shared cost, private laundry /
            </p>
            <div className="pt-2">
              <Link href="/login">
                <button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest px-12 py-5 shadow-xl hover:scale-105 transition-all cursor-pointer">
                  Start
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column (Floating Showcase) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white/40 dark:border-slate-800/40 shadow-xl">
              <div className="flex gap-2 mb-4">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-850 px-3 py-1 rounded-full">Shared</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-850 px-3 py-1 rounded-full">Smart</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-slate-900 dark:bg-slate-800 px-3 py-1 rounded-full">24H</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-serif text-slate-850 dark:text-white font-bold leading-tight">
                Unique schedule & ergonomics
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">From rooms to hallways.</p>
              
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden mt-6 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800">
                <Image 
                  src="/images/wewash_appliance.png" 
                  alt="WeWash Appliance Rendering" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating Rotation Indicator */}
              <div className="absolute right-4 sm:right-6 top-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3.5 rounded-2xl flex items-center gap-3 border border-white/20 shadow-lg">
                <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
                  <RotateCw className="h-4 w-4" />
                </div>
                <div className="text-left pr-2">
                  <span className="block text-[8px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest leading-none">Rotation</span>
                  <span className="block text-[9px] font-black uppercase text-slate-850 dark:text-white tracking-widest mt-1">Active</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Bar / Footer */}
      <footer className="w-full mt-auto z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end w-full gap-6 lg:gap-0">
          
          {/* Left Block: Technical Callout */}
          <div className="bg-slate-200 dark:bg-slate-900 rounded-tr-[2.5rem] p-6 pr-12 flex gap-4 items-center w-full sm:max-w-[360px] shadow-sm">
            <div className="h-16 w-16 relative rounded-2xl overflow-hidden bg-white/25 shrink-0 border border-white/20">
              <Image 
                src="/images/wewash_tech.png" 
                alt="WeWash Tech Cutout" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white leading-tight">We use best stands!</h4>
              <p className="text-[9px] font-semibold text-slate-850 dark:text-slate-400 mt-1 leading-normal max-w-[180px]">
                Heavy-duty mobile standing frames with dual lock wheels.
              </p>
            </div>
          </div>

          {/* Center Block: Stats */}
          <div className="flex flex-col items-center gap-2 pb-6">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-[#f8fafc] dark:border-[#0f172a] bg-slate-300 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">A</div>
              <div className="h-8 w-8 rounded-full border-2 border-[#f8fafc] dark:border-[#0f172a] bg-slate-400 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">B</div>
              <div className="h-8 w-8 rounded-full border-2 border-[#f8fafc] dark:border-[#0f172a] bg-slate-500 dark:bg-slate-600 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">C</div>
            </div>
            <div className="text-center leading-none">
              <span className="block font-serif text-lg font-black text-slate-850 dark:text-white leading-none">500+</span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mt-0.5">Active Rooms</span>
            </div>
          </div>

          {/* Right Block: Pitch & Action Link */}
          <div className="text-center lg:text-right px-6 lg:pr-12 pb-6 max-w-sm">
            <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-800 dark:text-white leading-snug tracking-wider">
              We can combine private convenience & shared cost
            </h4>
            <Link href="/login" className="inline-block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-350 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline underline-offset-4 mt-2">
              Access Portal
            </Link>
          </div>

        </div>
      </footer>
    </div>
  );
}
