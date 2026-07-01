"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Bell, Calendar, CreditCard, Droplet, FileWarning, LogOut, 
  Settings, Info, AlertTriangle, ShieldCheck, ArrowRight, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950/50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-900 px-6 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Droplet className="h-6 w-6 text-blue-500 fill-current animate-pulse" />
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            WeWash Student
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-blue-200">
              <AvatarImage src="https://github.com/shadcn.png" alt="@student" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">John Doe</p>
              <p className="text-[10px] text-muted-foreground">Atlantic Hall • Room 104</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/login")}
            title="Logout"
            className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Laundry Center</h1>
            <p className="text-muted-foreground mt-1">Hello John. Check rotation schedule, review subscription dues, or file reports.</p>
          </div>

          {/* Fault Dialog Trigger */}
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger
              className="inline-flex items-center justify-center rounded-full text-sm font-semibold bg-red-600 hover:bg-red-700 text-white h-10 px-4 cursor-pointer"
            >
              <FileWarning className="mr-2 h-4 w-4" /> Report Fault
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
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Machine Assignment & Rotation Schedule */}
          <Card className="col-span-1 lg:col-span-2 border-blue-100 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-blue-600 tracking-wider">Current Schedule</CardDescription>
              <CardTitle className="text-2xl flex items-center justify-between">
                <span>Machine W01 (Floor 1)</span>
                <Badge className="bg-green-500 text-white">In Your Room Today</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 border rounded-xl flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Your Assigned Turn: Wednesday</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access starts **Wednesday at 8:00 PM** and ends **Thursday at 8:00 PM**.
                  </p>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                    ✔️ Keep machine in Room 104 until Thursday 8:00 PM, then wheel it to Room 105.
                  </p>
                </div>
              </div>

              {/* Day Rotation Slider */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Atlantic Hall Week Rotation</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                  {[
                    { day: "Sun", room: "101" },
                    { day: "Mon", room: "102" },
                    { day: "Tue", room: "103" },
                    { day: "Wed", room: "104" },
                    { day: "Thu", room: "105" },
                    { day: "Fri", room: "106" },
                    { day: "Sat", room: "107" },
                  ].map((item, idx) => {
                    const isStudentDay = item.day === "Wed";
                    return (
                      <div 
                        key={idx} 
                        className={`p-2 rounded-lg border ${
                          isStudentDay 
                            ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-500/10 scale-105" 
                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100"
                        }`}
                      >
                        <div>{item.day}</div>
                        <div className={`text-[10px] mt-1 ${isStudentDay ? "text-blue-100" : "text-muted-foreground"}`}>
                          R{item.room}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dues and Billing Card */}
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-blue-600 tracking-wider">Subscription</CardDescription>
              <CardTitle className="text-2xl">Billing Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm border-b pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekly Rate:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">GHS 35.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Setup Fee Status:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Paid (₵50.00)</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t mt-2 text-slate-900 dark:text-slate-100">
                  <span>Balance Outstanding:</span>
                  <span className="text-green-600">GHS 0.00</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-xs text-muted-foreground space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-blue-500" /> Manual Payment Note
                </span>
                Send Mobile Money to WeWash merchant details and submit the confirmation via the official WhatsApp chat.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protection & Handling Guidelines Section */}
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <Card className="col-span-1 md:col-span-2 shadow-sm border-blue-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                Movable Base & Hose Protection Rules
              </CardTitle>
              <CardDescription>Follow these rules to prevent appliance damage and safeguard your hostel deposit.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 items-center">
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">1</span>
                  <p><strong>Never disconnect hoses from the back of the machine.</strong> Only disconnect from the wall tap, drain the remaining water, and coil neatly on top.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">2</span>
                  <p><strong>Lock the stand wheels before washing.</strong> Once the machine enters your room, lock the wheels and adjust stabilizers. Do not run cycles while on moving wheels.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">3</span>
                  <p><strong>Cooperative 8:00 PM Move.</strong> Communicate on WhatsApp. Ensure the recipient room is ready. Avoid dragging machines across doors or stairs.</p>
                </div>
              </div>
              <div className="relative w-full h-[180px] rounded-lg overflow-hidden border bg-slate-100">
                <Image 
                  src="/images/base_instructions.png" 
                  alt="Washing Machine Movable Base Schematic" 
                  fill 
                  className="object-contain p-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity List */}
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <CardDescription>Log of your portal history.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-xs">
                {recentActivities.map((act, i) => (
                  <div key={i} className="flex justify-between items-start p-3 hover:bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                      <p className="text-[10px] text-muted-foreground">{act.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{act.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
