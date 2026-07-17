"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Activity,
  Users,
  Wrench,
  Settings,
  Building2,
  CalendarDays,
  Banknote,
} from "lucide-react";
import { AuthFrame, GoogleGlyph } from "@/components/pixel/auth-frame";
import { DashboardShell } from "@/components/pixel/dashboard-shell";
import { authClient, useSession } from "@/lib/auth/client";
import {
  PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";

const menuItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Hostels", href: "/admin/halls", icon: Building2 },
  { name: "Machines", href: "/admin/machines", icon: Activity },
  { name: "Rotation", href: "/admin/rotation", icon: CalendarDays },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: Banknote },
  { name: "Faults", href: "/admin/faults", icon: Wrench },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

type AuthTab = "password" | "otp";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [tab, setTab] = React.useState<AuthTab>("password");
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
    toast.success("Welcome back, operator.");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Phone OTP via Better Auth phoneNumber plugin when available
      const client = authClient as typeof authClient & {
        phoneNumber?: {
          sendOtp: (args: { phoneNumber: string }) => Promise<{ error?: { message?: string } }>;
        };
      };
      if (!client.phoneNumber?.sendOtp) {
        toast.error("OTP sign-in is not configured on this deployment.");
        setIsLoading(false);
        return;
      }
      const { error } = await client.phoneNumber.sendOtp({ phoneNumber: phone });
      if (error) {
        toast.error(error.message || "Could not send OTP.");
      } else {
        setOtpSent(true);
        toast.success("OTP sent. Check your phone.");
      }
    } catch {
      toast.error("OTP is unavailable. Use email/password or Google.");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const client = authClient as typeof authClient & {
        phoneNumber?: {
          verify: (args: {
            phoneNumber: string;
            code: string;
          }) => Promise<{ error?: { message?: string } }>;
        };
      };
      if (!client.phoneNumber?.verify) {
        toast.error("OTP verification is not configured.");
        setIsLoading(false);
        return;
      }
      const { error } = await client.phoneNumber.verify({ phoneNumber: phone, code: otp });
      if (error) toast.error(error.message || "Invalid code.");
      else toast.success("Signed in.");
    } catch {
      toast.error("Could not verify OTP.");
    }
    setIsLoading(false);
  };

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
        sub="OPERATIONS CENTER"
        machineSrc="/images/machine-open.webp"
        machineAlt="Open washing machine"
        footer={
          <>
            <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
              {user && !isAdmin
                ? "This account isn't an operator. Sign in with an admin account."
                : "Authorized operators only. Google, email/password, or OTP."}
            </p>
            <p className="text-[11px] font-semibold text-teal-900/50 dark:text-teal-100/50">
              <Link href="/terms" className="underline">Terms</Link>
              {" · "}
              <Link href="/privacy" className="underline">Privacy</Link>
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

          <div className="flex items-center gap-3 py-5" aria-hidden="true">
            <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-900/40 dark:text-teal-100/40">
              or
            </span>
            <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTab("password")}
              className={`border-2 px-2 py-2 text-[9px] font-black uppercase tracking-widest ${
                tab === "password"
                  ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
                  : "border-teal-900/20 text-teal-900/50 dark:border-teal-100/20 dark:text-teal-100/50"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setTab("otp")}
              className={`border-2 px-2 py-2 text-[9px] font-black uppercase tracking-widest ${
                tab === "otp"
                  ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
                  : "border-teal-900/20 text-teal-900/50 dark:border-teal-100/20 dark:text-teal-100/50"
              }`}
            >
              OTP
            </button>
          </div>

          {tab === "password" ? (
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
                <PixelLabel htmlFor="password">Password</PixelLabel>
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
          ) : (
            <form
              onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
              className="space-y-5 text-left"
            >
              <div className="space-y-2">
                <PixelLabel htmlFor="phone">Phone number</PixelLabel>
                <PixelInput
                  id="phone"
                  type="tel"
                  placeholder="0241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              {otpSent && (
                <div className="space-y-2">
                  <PixelLabel htmlFor="otp">One-time code</PixelLabel>
                  <PixelInput
                    id="otp"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              )}
              <PixelButton type="submit" variant="dark" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
              </PixelButton>
            </form>
          )}

          {user && !isAdmin && (
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="mt-4 w-full text-[10px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
            >
              Sign out {user.email}
            </button>
          )}
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
