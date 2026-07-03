"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LayoutDashboard, Activity, Users, Wrench } from "lucide-react";
import { AuthFrame, GoogleGlyph } from "@/components/pixel/auth-frame";
import { DashboardShell } from "@/components/pixel/dashboard-shell";
import {
  PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";

const menuItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Machines", href: "/admin/machines", icon: Activity },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Faults", href: "/admin/faults", icon: Wrench },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Manage admin auth state right on the /admin route
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  if (!isAuthenticated) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        toast.success("Welcome back, chief. Operations are live.");
        setIsAuthenticated(true);
      }, 800);
    };

    return (
      <AuthFrame
        word="@DMIN"
        sub="OPERATIONS CENTER, EYES ON EVERY DRUM"
        machineSrc="/images/machine-open.webp"
        machineAlt="Open washing machine standing in for a letter"
        footer={
          <>
            <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
              By continuing, you agree to the{" "}
              <a href="#" className="underline hover:text-teal-800 dark:hover:text-teal-200">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-teal-800 dark:hover:text-teal-200">
                Privacy Policy
              </a>
              .
            </p>
            <Link
              href="/login"
              className="text-[11px] font-black uppercase tracking-widest text-teal-700 underline decoration-2 underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Access student portal
            </Link>
          </>
        }
      >
        <PixelCard bolts className="p-6 sm:p-8">
          <PixelButton
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setIsAuthenticated(true)}
          >
            <GoogleGlyph className="h-4 w-4" />
            Continue with Google
          </PixelButton>

          <div className="flex items-center gap-3 py-6" aria-hidden="true">
            <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-900/40 dark:text-teal-100/40">
              or
            </span>
            <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <PixelLabel htmlFor="email">Email address</PixelLabel>
              <PixelInput
                id="email"
                type="email"
                placeholder="admin@wewash.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <PixelLabel htmlFor="password">Security password</PixelLabel>
                <a
                  href="#"
                  className="text-[9px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
                >
                  Forgot?
                </a>
              </div>
              <PixelInput
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <PixelButton type="submit" variant="dark" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Enter ops center"}
            </PixelButton>
          </form>
        </PixelCard>
      </AuthFrame>
    );
  }

  return (
    <DashboardShell
      portal="Admin"
      note="UCC ATLANTIC HALL - LIVE OPERATIONS"
      navItems={menuItems}
      userName="Super Admin"
      userMeta="admin@wewash.com"
      userInitials="AD"
      onLogout={() => setIsAuthenticated(false)}
    >
      {children}
    </DashboardShell>
  );
}
