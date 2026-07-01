import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Droplet, RotateCw, ShieldCheck, Zap, Calendar, HeartHandshake, Shield, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
            <Droplet className="h-6 w-6 fill-current animate-pulse text-blue-500" />
            <span>WeWash</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#problem" className="transition-colors hover:text-foreground">The Problem</a>
            <a href="#solution" className="transition-colors hover:text-foreground">Our Solution</a>
            <a href="#schedule" className="transition-colors hover:text-foreground">Schedule</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full px-6">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10">
                Access Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20">
        <div className="container mx-auto px-6 grid gap-12 lg:grid-cols-2 items-center">
          <div className="flex flex-col space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 w-fit">
              <Sparkles className="h-3 w-3" />
              <span>Shared Appliance Subscription Network</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none">
              Your Own Washing Machine, <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                Shared Cost.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Why pay per load or wash by hand? Subscribe to high-quality, fully automatic washing machines that rotate directly through your hostel rooms. Private, convenient, and unlimited.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login">
                <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25">
                  Get Started
                </Button>
              </Link>
              <a href="#schedule">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  View Rotation Schedule
                </Button>
              </a>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-muted">
              <Image 
                src="/images/wewash_hero.png" 
                alt="WeWash Smart Washing Machine in Dorm" 
                fill 
                className="object-cover" 
                priority
              />
            </div>
            {/* Soft decorative blur */}
            <div className="absolute -z-10 -bottom-10 -left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="py-20 border-t border-border/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">The Hostel Laundry Dilemma</h2>
            <p className="text-muted-foreground mt-4">Traditional ways of doing laundry in university halls are stressful, expensive, and inconvenient.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4 text-red-500">Traditional Laundromats</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">❌ Mixed clothes with strangers</li>
                <li className="flex items-start gap-2">❌ Pay every single time you wash</li>
                <li className="flex items-start gap-2">❌ Long wait times and strict operating hours</li>
                <li className="flex items-start gap-2">❌ Risk of damaged or missing clothes</li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4 text-red-500">Buying Your Own Machine</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">❌ Too expensive for a single student or room</li>
                <li className="flex items-start gap-2">❌ Hostel rooms are temporary</li>
                <li className="flex items-start gap-2">❌ Maintenance and moving logistics are complex</li>
                <li className="flex items-start gap-2">❌ Plumbing and electrical connections are difficult</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section id="solution" className="py-20 bg-blue-50/30 dark:bg-blue-950/10 border-t border-border/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">The WeWash Solution</h2>
            <p className="text-muted-foreground mt-4">We sell access, not ownership. A high-quality washing machine rotates across 7 rooms. Your room gets 1 exclusive day per week.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 bg-background rounded-xl shadow-sm border border-border/40 flex flex-col space-y-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg w-fit">
                <RotateCw className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">1 Machine, 7 Rooms</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Shared across nearby rooms on the same floor. Each room has exclusive access for 24 hours starting every evening at 8:00 PM.
              </p>
            </div>
            <div className="p-6 bg-background rounded-xl shadow-sm border border-border/40 flex flex-col space-y-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Safe Movable Base</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Locked stabilization legs and heavy-duty wheels make transferring simple. Hoses stay connected to the machine to protect all fittings.
              </p>
            </div>
            <div className="p-6 bg-background rounded-xl shadow-sm border border-border/40 flex flex-col space-y-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg w-fit">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Automatic & Advanced</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fully automatic front-loading machines. Program control, quick washes, energy efficiency, and full support guides included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rotation Schedule Section */}
      <section id="schedule" className="py-20 border-t border-border/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">The 8:00 PM Rotation Schedule</h2>
            <p className="text-muted-foreground mt-4">Every day at 8:00 PM, rooms work together to move the machine to the next room. Water is drained, hoses coiled, and wheels unlocked.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 max-w-5xl mx-auto">
            {[
              { day: "Sunday", room: "Room 1", time: "8:00 PM" },
              { day: "Monday", room: "Room 2", time: "8:00 PM" },
              { day: "Tuesday", room: "Room 3", time: "8:00 PM" },
              { day: "Wednesday", room: "Room 4", time: "8:00 PM" },
              { day: "Thursday", room: "Room 5", time: "8:00 PM" },
              { day: "Friday", room: "Room 6", time: "8:00 PM" },
              { day: "Saturday", room: "Room 7", time: "8:00 PM" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border text-center shadow-sm">
                <span className="text-xs text-muted-foreground uppercase font-bold">{s.day}</span>
                <span className="text-lg font-extrabold mt-2 text-blue-600 dark:text-blue-400">{s.room}</span>
                <span className="text-xs text-muted-foreground mt-1">{s.time} Arrival</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-blue-50/30 dark:bg-blue-950/10 border-t border-border/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Simple Subscription Pricing</h2>
            <p className="text-muted-foreground mt-4">Unlimited washing on your scheduled day. Paid via Mobile Money.</p>
          </div>
          <div className="max-w-md mx-auto bg-background p-8 rounded-2xl shadow-xl border border-blue-100/50 dark:border-blue-950 flex flex-col space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-muted-foreground">Standard Subscription</h3>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-5xl font-extrabold tracking-tight">₵35</span>
                <span className="text-lg text-muted-foreground ml-2">/ week</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">(₵35–₵40 introductory pricing per student)</p>
            </div>
            <div className="border-t border-border pt-6">
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-2">✅ Unlimited loads on your assigned day</li>
                <li className="flex items-center gap-2">✅ Automatic SMS alerts and turn notifications</li>
                <li className="flex items-center gap-2">✅ Weekly maintenance & safety inspections</li>
                <li className="flex items-center gap-2">✅ Zero maintenance costs for students</li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-center text-xs text-muted-foreground">
              * Requires a one-time joining/setup fee of GHS 50 to cover the movable base stand, water hose extensions, and emergency maintenance fund.
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full rounded-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Join the Waiting List
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <Droplet className="h-6 w-6 text-blue-500 fill-current" />
            <span>WeWash</span>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} WeWash Inc. All rights reserved. Servicing Atlantic Hall, UCC.
          </p>
          <div className="flex gap-4 text-xs text-slate-300">
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
