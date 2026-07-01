"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell, Calendar, CreditCard, Droplet, FileWarning, LogOut,
  Settings, Info, AlertTriangle, ShieldCheck, ArrowRight, Sparkles,
  ChevronRight, TrendingUp, HelpCircle, Lock, Search, Plus, Mic,
  WrenchIcon, Smile, Meh, Frown, Heart, Star, Wrench, Activity
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

          {/* Payments Tracker Dropdown Quick Action */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full px-3 sm:px-5 h-9 sm:h-11 font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 shadow-xs bg-white dark:bg-slate-900 ml-1 sm:ml-2 shrink-0"
                />
              }
            >
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              Dues & Payments ▾
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/50 dark:border-slate-850">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 py-1.5">
                  Payments Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                <DropdownMenuItem className="flex items-center justify-between px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Weekly Dues</p>
                    <p className="text-[9px] text-slate-400">GHS 35.00</p>
                  </div>
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/10">Completed</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">One-time Setup</p>
                    <p className="text-[9px] text-slate-400">GHS 50.00</p>
                  </div>
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/10">Completed</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
              <DropdownMenuItem
                render={
                  <a href="#billing" className="w-full text-[10px] font-bold text-[#2563eb] hover:underline px-2.5 py-1.5 flex items-center justify-between" />
                }
              >
                <span>View receipt log</span>
                <ArrowRight className="h-3 w-3" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* 3. Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
        {/* Unified Active Appliance Dial (col-span-9) - Frameless */}
        <div className="col-span-12 lg:col-span-9 relative min-h-[340px] flex items-center justify-center">

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

          {/* Bottom Right Info */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end text-right hidden sm:flex">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room 104</span>
            <span className="text-xs font-black text-[#2563eb]">In Use Today</span>
          </div>

          {/* Dial Container */}
          <div className="relative w-full h-full flex items-center justify-center max-w-[400px] mx-auto mt-4 sm:mt-0">

            {/* Concentric outer arc for menu (Clipped) */}
            <div
              className="absolute w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-full border-[24px] md:border-[30px] border-slate-200/40 dark:border-slate-800/60"
              style={{ clipPath: 'polygon(75% 15%, 100% 0%, 100% 100%, 75% 85%)' }}
            />

            {/* Icons floating perfectly on the arc */}
            <div className="absolute w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-full pointer-events-none z-20">
              {/* Settings */}
              <button className="pointer-events-auto absolute top-[14%] right-[10%] md:top-[16%] md:right-[13%] h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2563eb] hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all cursor-pointer bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700">
                <Settings className="h-4 w-4" />
              </button>
              {/* Center Drop / Guidelines */}
              <button className="pointer-events-auto absolute top-1/2 right-[-14px] md:right-[-6px] -translate-y-1/2 h-11 w-11 rounded-full flex items-center justify-center text-slate-500 hover:text-[#2563eb] hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700">
                <Droplet className="h-5 w-5" />
              </button>
              {/* Chart/Info */}
              <button className="pointer-events-auto absolute bottom-[14%] right-[10%] md:bottom-[16%] md:right-[13%] h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2563eb] hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all cursor-pointer bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700">
                <Activity className="h-4 w-4" />
              </button>
            </div>

            {/* The Main Dial / Clock (No Background) */}
            <div className="absolute w-[280px] h-[280px] md:w-[320px] md:h-[320px] flex flex-col items-center justify-center z-10 pointer-events-none">

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
              <div className="relative z-20 flex flex-col items-center justify-center w-36 h-36 rounded-full backdrop-blur-md bg-white/30 dark:bg-slate-900/40 shadow-2xl shadow-white/20 dark:shadow-slate-900/20 border border-white/50 dark:border-slate-800/50">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Left</span>
                <h2 className="text-5xl md:text-6xl font-light text-slate-900 dark:text-white tracking-tighter leading-none">
                  14<span className="text-xl md:text-2xl text-slate-400 font-normal ml-0.5">h</span>
                </h2>
              </div>
            </div>

          </div>
        </div>

        {/* Right column group: 13 Days, Mini vertical graph, Main Stocks (col-span-3) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-[340px] justify-between">
          {/* Top Row: 13 Days & Mini Graph */}
          <div className="flex gap-4 h-[100px] shrink-0">
            {/* 13 Days Clock Card */}
            <Card className="flex-1 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[9px] font-bold text-slate-400">Days</span>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950 dark:text-white leading-none">1 Day</h4>
                <p className="text-[8px] text-slate-400 mt-0.5 font-semibold">Timeline</p>
              </div>
            </Card>

            {/* Mini vertical graph */}
            <Card className="flex-1 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[9px] font-bold text-slate-400">Load</span>
              </div>
              <div className="flex items-end gap-1 h-8">
                {[20, 50, 30, 80, 45].map((item, i) => (
                  <span key={i} className="bg-[#2563eb] rounded-xs flex-1" style={{ height: `${item}%` }} />
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom Row: Main Stocks Line Card */}
          <Card className="flex-1 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-4 flex items-center justify-between min-h-[100px]">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Hostel Load Ratio</span>
              <p className="text-[9px] text-slate-400 font-semibold">Cycle Status</p>
              <Badge className="bg-green-50 text-green-600 dark:bg-green-950/30 text-[8px] rounded-full font-bold px-1.5 py-0.2 mt-1 border border-green-200/20">Stable</Badge>
            </div>

            {/* Tiny SVG Line chart */}
            <div className="h-10 w-24">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d="M0,25 C20,20 40,5 60,15 C80,25 90,5 100,5"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </Card>
        </div>

        {/* Card 7: Concentric circular arcs (col-span-3) */}
        <Card className="md:col-span-3 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-[310px]">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-black text-slate-900 dark:text-white">Usage by Room</span>
            <Badge variant="outline" className="text-[9px] font-bold border-slate-200">2026 ▾</Badge>
          </div>

          {/* SVG Concentric Arcs */}
          <div className="relative h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Outer ring R104 */}
              <circle cx="50" cy="50" r="38" stroke="#F5F6F8" strokeWidth="6" fill="none" className="dark:stroke-slate-800" />
              <path d="M50 12 A 38 38 0 0 1 88 50" stroke="#2563eb" strokeWidth="6" fill="none" strokeLinecap="round" />

              {/* Middle ring R101 */}
              <circle cx="50" cy="50" r="28" stroke="#F5F6F8" strokeWidth="6" fill="none" className="dark:stroke-slate-800" />
              <path d="M50 22 A 28 28 0 0 1 78 50" stroke="#FF8D75" strokeWidth="6" fill="none" strokeLinecap="round" />

              {/* Inner ring R102 */}
              <circle cx="50" cy="50" r="18" stroke="#F5F6F8" strokeWidth="6" fill="none" className="dark:stroke-slate-800" />
              <path d="M50 32 A 18 18 0 0 1 68 50" stroke="#FFBCAD" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
            <div className="absolute text-[9px] font-extrabold text-slate-400">Total Loads</div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-1 text-[8px] font-bold text-center text-slate-500">
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 bg-[#2563eb] rounded-full mb-1" />
              <span>Room 104 (You)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 bg-[#FF8D75] rounded-full mb-1" />
              <span>Room 101</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 bg-[#FFBCAD] rounded-full mb-1" />
              <span>Room 102</span>
            </div>
          </div>
        </Card>

        {/* Card 8: Activity Manager (col-span-6) */}
        <Card className="md:col-span-6 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-[310px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-900 dark:text-white">Guidelines & Rules</span>
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 text-[9px] font-bold">
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-md cursor-pointer hover:bg-slate-100">Care</span>
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-md cursor-pointer hover:bg-slate-100">Transfers</span>
              <span className="px-2 py-0.5 bg-[#2563eb]/10 text-[#2563eb] border border-blue-200 dark:bg-blue-950/20 rounded-md cursor-pointer">Safety</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 flex-1">
            {/* Column 1: Dues outstanding barcode */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 flex flex-col justify-between border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Outstanding Dues</p>
                <h4 className="text-base font-black text-slate-950 dark:text-white mt-1">₵0.00</h4>
              </div>
              <div className="h-10 w-full flex items-end gap-1 pb-1">
                {[2, 3, 2, 4, 3, 5, 2, 4].map((item, i) => (
                  <span key={i} className="bg-[#2563eb] rounded-xs flex-1" style={{ height: `${item * 10}%` }} />
                ))}
              </div>
            </div>

            {/* Column 2: Bullet check lists */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 flex flex-col justify-between border border-slate-100 dark:border-slate-800">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Safe Moving Rules</p>
              <div className="space-y-1 py-1 text-[7.5px] font-bold text-slate-500 leading-tight">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[6px]">✓</span>
                  <span className="truncate">Never disconnect tap hoses</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[6px]">✓</span>
                  <span className="truncate">Lock base wheels before run</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[6px]">✓</span>
                  <span className="truncate">8:00 PM mutual room swap</span>
                </div>
              </div>
            </div>

            {/* Column 3: Wrench action */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 flex flex-col justify-between border border-slate-100 dark:border-slate-800">
              <div className="relative w-full h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border">
                <Image
                  src="/images/base_instructions.png"
                  alt="Washing Machine Movable Base Schematic"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <p className="text-[7.5px] font-semibold text-slate-400 leading-normal">Movable Base & Hose Protection Schematic.</p>
              <a href="#guidelines" className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[9px] font-bold py-1 rounded-full text-center cursor-pointer">Guide</a>
            </div>
          </div>
        </Card>

        {/* Card 9: Rating Feedback (col-span-3) */}
        <Card className="md:col-span-3 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-[310px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Hostel Feedback</h3>
              <p className="text-[9px] text-slate-400 font-semibold leading-normal">How was your laundry experience today?</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">×</button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 border rounded-2xl p-4 flex flex-col items-center justify-center my-3">
            <Smile className="h-10 w-10 text-blue-400 animate-bounce" />
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-2">Smooth & Clean</p>
            <p className="text-[9px] text-slate-400 font-semibold">Feedback by John Doe</p>
          </div>

          <div className="flex justify-between items-center gap-1">
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Frown className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Meh className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-[#2563eb] text-white rounded-full flex items-center justify-center cursor-pointer"><Smile className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Heart className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Star className="h-4.5 w-4.5" /></button>
          </div>
        </Card>
      </div>
    </div>
  );
}
