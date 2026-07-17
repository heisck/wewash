"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { OtpBoxes } from "@/components/auth/otp-boxes";
import { AUTH_OTP } from "@/lib/config/constants";
import { authClient, useSession } from "@/lib/auth/client";
import { otpErrorMessage } from "@/lib/auth/otp-errors";
import { getEmailError } from "@/lib/utils/email";
import { toE164Ghana } from "@/lib/utils/phone-client";
import { useSecondsCountdown } from "@/hooks/use-seconds-countdown";
import {
  PixelButton, PixelCard, PixelEmailInput, PixelInput, PixelLabel, PixelPasswordInput,
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
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [tab, setTab] = React.useState<AuthTab>("password");
  const [isLoading, setIsLoading] = React.useState(false);
  const [forceEmailError, setForceEmailError] = React.useState(false);
  const [resendEndsAt, setResendEndsAt] = React.useState<number | null>(null);
  const [expiresEndsAt, setExpiresEndsAt] = React.useState<number | null>(null);

  const resend = useSecondsCountdown(resendEndsAt);
  const expires = useSecondsCountdown(expiresEndsAt);
  const expiryMinutes = Math.ceil(AUTH_OTP.EXPIRES_IN_SECONDS / 60);

  const startOtpTimers = () => {
    const now = Date.now();
    setResendEndsAt(now + AUTH_OTP.RESEND_COOLDOWN_SECONDS * 1000);
    setExpiresEndsAt(now + AUTH_OTP.EXPIRES_IN_SECONDS * 1000);
  };

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
    if (getEmailError(email)) {
      setForceEmailError(true);
      return;
    }
    setIsLoading(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    setIsLoading(false);
    if (error) return toast.error(error.message || "Invalid credentials.");
    toast.success("Welcome back, operator.");
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (resend.active) {
      toast.error(`Wait ${resend.label} before requesting another code.`);
      return;
    }
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error("Enter your operator phone number.");
      return;
    }
    const phoneNumber = toE164Ghana(trimmed);
    if (!phoneNumber) {
      toast.error(
        "That doesn’t look like a valid Ghana mobile number. Use 0241234567 or +233241234567."
      );
      return;
    }
    setPhone(phoneNumber);
    setIsLoading(true);
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (
          error.code === "INVALID_PHONE_NUMBER" ||
          msg.includes("not registered") ||
          msg.includes("invalid phone")
        ) {
          toast.error(
            error.message ||
              "This phone number is not registered for operator access."
          );
        } else {
          toast.error(error.message || "Could not send OTP.");
        }
        // Stay on phone entry — don’t show OTP boxes for a failed send
        setOtpSent(false);
      } else {
        setOtp("");
        setOtpSent(true);
        startOtpTimers();
        toast.success(
          `OTP sent. Expires in ${expiryMinutes} minutes. Do not share it.`
        );
      }
    } catch {
      toast.error("OTP is unavailable. Use email/password or Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\D/g, "").length !== AUTH_OTP.LENGTH) {
      toast.error(`Enter the full ${AUTH_OTP.LENGTH}-digit code.`);
      return;
    }
    if (expires.done && expiresEndsAt != null) {
      toast.error("This code has expired. Request a new one.");
      return;
    }
    const phoneNumber = toE164Ghana(phone) ?? phone;
    setIsLoading(true);
    try {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber,
        code: otp,
      });
      if (error) {
        toast.error(otpErrorMessage(error, "Invalid OTP code."));
        // Keep UI in sync when server says expired
        if (
          error.code === "OTP_EXPIRED" ||
          (error.message ?? "").toLowerCase().includes("expired")
        ) {
          setExpiresEndsAt(Date.now());
        }
      } else {
        toast.success("Signed in.");
        router.refresh();
      }
    } catch {
      toast.error("Could not verify OTP.");
    }
    setIsLoading(false);
  };

  // Password recovery is public (no session) but lives under /admin for branding.
  if (pathname === "/admin/forgot-password") {
    return <>{children}</>;
  }

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
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left" noValidate>
              <div className="space-y-1.5">
                <PixelLabel htmlFor="email">Email address</PixelLabel>
                <PixelEmailInput
                  id="email"
                  placeholder="admin@wewash.app"
                  value={email}
                  onChange={setEmail}
                  forceShowError={forceEmailError}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <PixelLabel htmlFor="password">Password</PixelLabel>
                  <Link
                    href="/admin/forgot-password"
                    className="text-[10px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
                  >
                    Forgot?
                  </Link>
                </div>
                <PixelPasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <p className="h-4" aria-hidden="true">
                  {"\u00a0"}
                </p>
              </div>
              <PixelButton type="submit" variant="dark" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Enter ops center"}
              </PixelButton>
            </form>
          ) : (
            <form
              onSubmit={otpSent ? handleVerifyOtp : (e) => void handleSendOtp(e)}
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
                  disabled={otpSent && resend.active}
                />
              </div>
              {otpSent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <PixelLabel htmlFor="otp">One-time code</PixelLabel>
                    {expiresEndsAt != null && (
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest tabular-nums ${
                          expires.done
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-teal-700 dark:text-teal-300"
                        }`}
                      >
                        {expires.done ? "Expired" : `Expires ${expires.label}`}
                      </span>
                    )}
                  </div>
                  <OtpBoxes
                    id="otp"
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading || expires.done}
                    autoFocus
                  />
                  <PixelButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isLoading || resend.active}
                    onClick={() => void handleSendOtp()}
                  >
                    {resend.active
                      ? `Resend in ${resend.label}`
                      : "Resend code"}
                  </PixelButton>
                </div>
              )}
              <PixelButton
                type="submit"
                variant="dark"
                size="lg"
                className="w-full"
                disabled={
                  isLoading ||
                  (!otpSent && resend.active) ||
                  (otpSent &&
                    (expires.done ||
                      otp.replace(/\D/g, "").length !== AUTH_OTP.LENGTH))
                }
              >
                {isLoading
                  ? "Please wait..."
                  : otpSent
                    ? "Verify OTP"
                    : resend.active
                      ? `Send in ${resend.label}`
                      : "Send OTP"}
              </PixelButton>
              <p className="text-center text-[10px] font-semibold text-teal-900/40 dark:text-teal-100/40">
                <Link
                  href="/admin/forgot-password"
                  className="font-black text-teal-700 underline dark:text-teal-300"
                >
                  Reset password with email or phone
                </Link>
              </p>
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
