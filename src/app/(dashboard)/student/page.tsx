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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2">
        {/* Left Side: Date widget & Fault dialog trigger */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Day number Circle */}
          <div className="h-16 w-16 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full flex flex-col items-center justify-center font-bold text-slate-800 dark:text-slate-100 shadow-xs relative">
            <span className="text-[20px] font-black leading-none">19</span>
            <span className="absolute bottom-1.5 h-1 w-1 bg-red-500 rounded-full" />
          </div>
          
          {/* Date Label */}
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-800 hidden sm:block" />
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wed, December</p>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">Today: Wed 8 PM - Thu 8 PM</p>
          </div>
          
          {/* Coral pill CTA button (Report Fault) */}
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger
              className="bg-[#F05A3E] hover:bg-[#d9482d] text-white rounded-full px-6 h-11 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/10 ml-0 sm:ml-4"
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

          {/* Small notification indicator */}
          <button className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full flex items-center justify-center cursor-pointer relative shadow-xs">
            <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
        </div>

        {/* Right Side: Welcome message & microphone */}
        <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
          <div className="text-left lg:text-right">
            <h1 className="text-2xl font-black text-slate-950 dark:text-white leading-none">
              Hey John, need help? 👋
            </h1>
            <p className="text-base text-slate-400 font-bold tracking-tight mt-1">
              Just ask me anything!
            </p>
          </div>
          {/* Mic Circle button */}
          <button className="h-12 w-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center cursor-pointer shadow-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800">
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 3. Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
              {/* Card 1: Toolbar + VISA style machine status (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 flex gap-4 h-[230px]">
          {/* Left Vertical Toolbar from Mockup */}
          <div className="w-12 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full py-5 flex flex-col items-center justify-between h-full shrink-0 shadow-xs">
            <div className="h-6 w-1.5 bg-[#F05A3E] rounded-full" />
            <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#F05A3E] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              <Plus className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#F05A3E] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 10.742l4.828-2.414m0 0a3 3 0 100-5.836 3 3 0 000 5.836zm-4.828 2.414a3 3 0 11-5.656 0 3 3 0 015.656 0zm0 0l4.828 2.414a3 3 0 11-4.828 2.414 3 3 0 014.828-2.414z" /></svg>
            </button>
          </div>
          
          <Card className="flex-1 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ACTIVE APPLIANCE</span>
                <Badge className="bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 rounded-full px-2 py-0.5 text-[9px] font-bold">
                  Room 104 today ▾
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold leading-none">Rotation Group 1</p>
                <h3 className="text-base font-black text-slate-950 dark:text-white mt-1.5 truncate">WEWASH-W01-ATL</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-black text-white dark:bg-slate-100 dark:text-slate-950 rounded-full px-4 py-1.5 text-[10px] font-bold cursor-pointer">In Use</button>
              <button className="border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 rounded-full px-4 py-1.5 text-[10px] font-bold cursor-pointer">Guidelines</button>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px] font-bold">
              <span className="text-slate-400">GHS 35.00/wk</span>
              <a href="#guidelines" className="text-[#F05A3E] flex items-center gap-0.5 hover:underline">
                Move Rules <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </Card>
        </div>

        {/* Card 2: Payments Tracker (col-span-3) */}
        <Card className="col-span-12 lg:col-span-3 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-[230px]">
          {/* Top Row: Total paid */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8.5 w-8.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Weekly Dues Paid</p>
                <p className="text-base font-extrabold text-slate-950 dark:text-white">GHS 35.00</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] font-bold border-slate-200 rounded-lg">Completed</Badge>
          </div>
          {/* Bottom Row: Setup paid */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8.5 w-8.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center">
                <Droplet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">One-time Setup Fee</p>
                <p className="text-base font-extrabold text-slate-950 dark:text-white">GHS 50.00</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] font-bold border-slate-200 rounded-lg">Completed</Badge>
          </div>
          {/* Footer link */}
          <div className="text-left pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <a href="#billing" className="text-[10px] font-bold text-[#F05A3E] hover:underline flex items-center gap-1">
              View receipt log
            </a>
          </div>
        </Card>

        {/* Card 3: Indicators - Base Stand & Progress Stack (col-span-2) */}
        <div className="col-span-12 lg:col-span-2 flex flex-col gap-6 h-[230px]">
          {/* Subcard 3A: Stand Lock */}
          <Card className="flex-1 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-950 dark:text-white leading-none">Stand Locked</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Stabilizers secure</p>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </Card>
          
          {/* Subcard 3B: Growth Rate circular ring */}
          <Card className="flex-1 shadow-xs border-slate-200/50 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-950 dark:text-white leading-none">24h Left</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Access period</p>
            </div>
            
            {/* Custom SVG Circular Progress Ring */}
            <div className="relative h-12 w-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#F05A3E]"
                  strokeWidth="3.5"
                  strokeDasharray="50, 100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[9px] font-black text-slate-805 dark:text-slate-100">50%</span>
            </div>
          </Card>
        </div>

        {/* Right column group: 13 Days, Mini vertical graph, Main Stocks (col-span-3) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-[230px] justify-between">
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
                  <span key={i} className="bg-[#F05A3E] rounded-xs flex-1" style={{ height: `${item}%` }} />
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
                  stroke="#F05A3E"
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
              <path d="M50 12 A 38 38 0 0 1 88 50" stroke="#F05A3E" strokeWidth="6" fill="none" strokeLinecap="round" />
              
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
              <span className="h-2 w-2 bg-[#F05A3E] rounded-full mb-1" />
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
              <span className="px-2 py-0.5 bg-[#F05A3E]/10 text-[#F05A3E] border border-orange-200 dark:bg-orange-950/20 rounded-md cursor-pointer">Safety</span>
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
                  <span key={i} className="bg-[#F05A3E] rounded-xs flex-1" style={{ height: `${item * 10}%` }} />
                ))}
              </div>
            </div>

            {/* Column 2: Bullet check lists */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 flex flex-col justify-between border border-slate-100 dark:border-slate-800">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Safe Moving Rules</p>
              <div className="space-y-1 py-1 text-[7.5px] font-bold text-slate-500 leading-tight">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F05A3E] text-white flex items-center justify-center text-[6px]">✓</span>
                  <span className="truncate">Never disconnect tap hoses</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F05A3E] text-white flex items-center justify-center text-[6px]">✓</span>
                  <span className="truncate">Lock base wheels before run</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F05A3E] text-white flex items-center justify-center text-[6px]">✓</span>
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
              <a href="#guidelines" className="w-full bg-[#F05A3E] hover:bg-[#d9482d] text-white text-[9px] font-bold py-1 rounded-full text-center cursor-pointer">Guide</a>
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
            <Smile className="h-10 w-10 text-orange-400 animate-bounce" />
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-2">Smooth & Clean</p>
            <p className="text-[9px] text-slate-400 font-semibold">Feedback by John Doe</p>
          </div>

          <div className="flex justify-between items-center gap-1">
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Frown className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Meh className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-[#F05A3E] text-white rounded-full flex items-center justify-center cursor-pointer"><Smile className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Heart className="h-4.5 w-4.5" /></button>
            <button className="h-8 w-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 cursor-pointer"><Star className="h-4.5 w-4.5" /></button>
          </div>
        </Card>
      </div>
    </div>
  );
}
