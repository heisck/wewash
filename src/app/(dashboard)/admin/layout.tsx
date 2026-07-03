"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutDashboard, Activity, Users, Wrench, Settings } from "lucide-react";
import { AuthFrame, GoogleGlyph } from "@/components/pixel/auth-frame";
import { DashboardShell } from "@/components/pixel/dashboard-shell";
import { authClient, useSession } from "@/lib/auth/client";
import {
  PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";

const menuItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Machines", href: "/admin/machines", icon: Activity },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Faults", href: "/admin/faults", icon: Wrench },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const user = session?.user as
    | { name: string; email: string; role?: string }
    | undefined;
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role ?? "");

  const handleGoogle = async () => {
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/admin" });
    } catch {
      toast.error("Could not start Google sign-in. Is it configured?");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setIsLoading(false);
    if (error) return toast.error(error.message || "Invalid credentials.");
    toast.success("Welcome back, chief. Operations are live.");
  };

  // While the session resolves, avoid flashing the login gate.
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] dark:bg-[#04100f]">
        <img src="/favicon.ico" alt="WeWash" className="h-12 w-12 animate-pulse object-contain" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AuthFrame
        word="@DMIN"
        sub="OPERATIONS CENTER, EYES ON EVERY DRUM"
        machineSrc="/images/machine-open.webp"
        machineAlt="Open washing machine standing in for a letter"
        footer={
          <>
            <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
              {user && !isAdmin
                ? "This account isn't an operator. Sign in with an admin account."
                : "Authorized operators only."}
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
            onClick={handleGoogle}
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
                placeholder="admin@wewash.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="password">Security password</PixelLabel>
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
            {user && !isAdmin && (
              <button
                type="button"
                onClick={() => authClient.signOut()}
                className="w-full text-[10px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
              >
                Sign out {user.email}
              </button>
            )}
          </form>
        </PixelCard>
      </AuthFrame>
    );
  }

  const initials = (user!.name || user!.email)
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardShell
      portal="Admin"
      note="LIVE OPERATIONS"
      navItems={menuItems}
      userName={user!.name || "Operator"}
      userMeta={user!.email}
      userInitials={initials}
      onLogout={async () => {
        await authClient.signOut();
        router.push("/admin/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
