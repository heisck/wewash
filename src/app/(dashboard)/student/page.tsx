"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell, Calendar, CreditCard, Droplet, FileWarning, LogOut,
  Settings, Info, AlertTriangle, ShieldCheck, ArrowRight, Sparkles,
  ChevronRight, TrendingUp, HelpCircle, Lock, Search, Plus, Mic,
  WrenchIcon, Smile, Meh, Frown, Heart, Star, Wrench, Activity, ScanLine
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentDashboard() {
  const router = useRouter();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [faultTitle, setFaultTitle] = useState("");
  const [faultDesc, setFaultDesc] = useState("");
  const [faultSeverity, setFaultSeverity] = useState("MEDIUM");
  const [faultMachine, setFaultMachine] = useState("WEWASH-W01-ATL");
  const [recentActivities, setRecentActivities] = useState([
    { title: "Weekly Dues Paid", detail: "GHS 35.00 via Mobile Money", date: "Today, 10:15 AM" },
    { title: "Setup Fee Paid", detail: "GHS 50.00 manual registration", date: "Oct 1, 2026" },
    { title: "Washing Contract Signed", detail: "Valid for Fall Semester 2026", date: "Oct 1, 2026" },
  ]);

  const handleReportFault = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Fault reported! Admin has been notified of "${faultTitle}" on ${faultMachine}`);

    // Add to simulated log
    const newActivity = {
      title: "Fault Ticket Created",
      detail: `Reported: ${faultTitle} (${faultSeverity})`,
      date: "Just now",
    };
    setRecentActivities([newActivity, ...recentActivities]);

    // Reset fields
    setFaultTitle("");
    setFaultDesc("");
    setIsReportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 2. Sub-Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 w-full">
        {/* Left Side: Date widget & Fault dialog trigger - Always on one line, shrinking responsively */}
        <div className="flex flex-nowrap items-center gap-2 sm:gap-4 w-full lg:w-auto min-w-0">
          {/* Day number Circle */}
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full flex flex-col items-center justify-center font-bold text-slate-800 dark:text-slate-100 shadow-xs relative shrink-0">
            <span className="text-sm sm:text-[20px] font-black leading-none">19</span>
            <span className="absolute bottom-1 sm:bottom-1.5 h-1 w-1 bg-red-500 rounded-full" />
          </div>

          {/* Date Label */}
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-800 hidden sm:block shrink-0" />
          <div className="min-w-0 shrink">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider truncate">Wed, December</p>
            <p className="text-[10px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 truncate">Today: Wed 8 PM - Thu 8 PM</p>
          </div>

          {/* Coral pill CTA button (Report Fault) */}
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full px-3 sm:px-6 h-9 sm:h-11 font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-2 cursor-pointer shadow-md shadow-blue-500/10 shrink-0 ml-1 sm:ml-4"
            >
              Report Fault <ArrowRight className="h-3.5 w-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Machine Fault</DialogTitle>
                <DialogDescription>
                  Help us keep WeWash running. Submit details of the fault.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReportFault} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="machine">Machine</Label>
                  <Select value={faultMachine} onValueChange={(val) => setFaultMachine(val || "WEWASH-W01-ATL")}>
                    <SelectTrigger id="machine">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEWASH-W01-ATL">WEWASH-W01-ATL (Floor 1 Group)</SelectItem>
                      <SelectItem value="WEWASH-W02-ATL">WEWASH-W02-ATL (Floor 2 Group)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue Summary</Label>
                  <Input
                    id="issue"
                    placeholder="e.g. Spin cycle is extremely noisy, or water won't drain"
                    value={faultTitle}
                    onChange={(e) => setFaultTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Detailed Description</Label>
                  <textarea
                    id="details"
                    placeholder="Please explain what happened and any error codes shown on the display..."
                    value={faultDesc}
                    onChange={(e) => setFaultDesc(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                    required
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={faultSeverity} onValueChange={(val) => setFaultSeverity(val || "MEDIUM")}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low (Cosmetic/minor delay)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (Vibrating/noise but washes)</SelectItem>
                      <SelectItem value="HIGH">High (Blocked drain/incomplete spin)</SelectItem>
                      <SelectItem value="CRITICAL">Critical (Total breakdown/no power)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Submit Ticket</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Scan Machine Button */}
          <button
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full px-3 sm:px-5 h-9 sm:h-11 font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-2 cursor-pointer shadow-md shadow-blue-500/10 ml-1 sm:ml-2 transition-all"
            onClick={() => alert('Opening QR scanner...')}
          >
            <ScanLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Scan Machine</span>
          </button>

        </div>
      </div>

      {/* 3. Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
        {/* Unified Active Appliance Dial (col-span-9) - Frameless */}
        <div className="col-span-12 relative min-h-[280px] sm:min-h-[340px] flex items-center justify-center">

          {/* Top Left Identifiers */}
          <div className="absolute top-6 left-6 z-20">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ACTIVE APPLIANCE</p>
            <h3 className="text-sm font-black text-slate-950 dark:text-white mt-0.5 truncate">WEWASH-W01-ATL</h3>
          </div>

          {/* Bottom Left Status */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#2563eb] animate-pulse" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Rotation Group 1</span>
          </div>

          {/* Rotation Indicator — circular badge on the left side of the clock */}
          <div className="absolute top-1/2 left-[8%] sm:left-[12%] md:left-[16%] -translate-y-1/2 z-20">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="176" strokeDashoffset="151" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">1</span>
                <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase">Day</span>
              </div>
            </div>
          </div>

          {/* Bottom Right Info */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end text-right hidden sm:flex">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room 104</span>
            <span className="text-xs font-black text-[#2563eb]">In Use Today</span>
          </div>

          {/* Dial Container */}
          <div className="relative w-full h-full flex items-center justify-center max-w-[400px] mx-auto mt-4 sm:mt-0">

            {/* Concentric outer arc for menu (Clipped) */}
            <div
              className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] rounded-full border-[20px] sm:border-[24px] md:border-[30px] border-slate-200/40 dark:border-slate-800/60"
              style={{ clipPath: 'polygon(75% 15%, 100% 0%, 100% 100%, 75% 85%)' }}
            />

            {/* Icons floating perfectly on the arc */}
            <div className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] rounded-full pointer-events-none z-20">
              {/* Settings */}
              <button onClick={() => router.push('/student/settings')} className="pointer-events-auto absolute top-[14%] right-[10%] md:top-[16%] md:right-[13%] h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2563eb] hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all cursor-pointer bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              {/* Center Drop / Guidelines */}
              <button onClick={() => router.push('/student/guidelines')} className="pointer-events-auto absolute top-1/2 right-[-14px] md:right-[-6px] -translate-y-1/2 h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-slate-500 hover:text-[#2563eb] hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700">
                <Droplet className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              {/* Chart/Info */}
              <button onClick={() => router.push('/student/billing')} className="pointer-events-auto absolute bottom-[14%] right-[10%] md:bottom-[16%] md:right-[13%] h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2563eb] hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all cursor-pointer bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* The Main Dial / Clock (No Background) */}
            <div className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] flex flex-col items-center justify-center z-10 pointer-events-none">

              {/* Massive Outer Dashed Ring & Clock Hand */}
              <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30">
                <circle
                  cx="50%" cy="50%" r="48%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-slate-400 dark:text-slate-500"
                  strokeDasharray="4 8"
                />
                {/* Clock Hand (pointing to 210 degrees / approx 14h) */}
                <line
                  x1="50%" y1="50%" x2="50%" y2="8%"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-slate-500 dark:text-slate-400"
                  style={{ transform: 'rotate(210deg)', transformOrigin: 'center' }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Text content (Blurred background masks clock hand overlap) */}
              <div className="relative z-20 flex flex-col items-center justify-center w-24 h-24 sm:w-36 sm:h-36 rounded-full backdrop-blur-md bg-white/30 dark:bg-slate-900/40 shadow-2xl shadow-white/20 dark:shadow-slate-900/20 border border-white/50 dark:border-slate-800/50">
                <span className="text-[7px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1">Time Left</span>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-slate-900 dark:text-white tracking-tighter leading-none">
                  14<span className="text-base sm:text-xl md:text-2xl text-slate-400 font-normal ml-0.5">h</span>
                </h2>
              </div>
            </div>

          </div>
        </div>


        {/* Card: Rating Feedback */}
        <Card className="col-span-12 max-w-lg mx-auto shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-8 flex flex-col justify-between min-h-[340px] w-full">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Hostel Feedback</h3>
              <p className="text-xs text-slate-400 font-semibold leading-normal">How was your laundry experience today?</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 text-lg">×</button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 border rounded-2xl p-6 flex flex-col items-center justify-center my-4">
            <Smile className="h-14 w-14 text-blue-400 animate-bounce" />
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-3">Smooth & Clean</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Feedback by John Doe</p>
          </div>

          <div className="flex justify-center items-center gap-3">
            <button className="h-10 w-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer transition-colors"><Frown className="h-5 w-5" /></button>
            <button className="h-10 w-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer transition-colors"><Meh className="h-5 w-5" /></button>
            <button className="h-10 w-10 bg-[#2563eb] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md shadow-blue-500/20"><Smile className="h-5 w-5" /></button>
            <button className="h-10 w-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer transition-colors"><Heart className="h-5 w-5" /></button>
            <button className="h-10 w-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer transition-colors"><Star className="h-5 w-5" /></button>
          </div>
        </Card>
      </div>
    </div>
  );
}
