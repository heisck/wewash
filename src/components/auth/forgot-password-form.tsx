"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUTH_OTP } from "@/lib/config/constants";
import { authClient } from "@/lib/auth/client";
import { otpErrorMessage } from "@/lib/auth/otp-errors";
import { getEmailError } from "@/lib/utils/email";
import { toE164Ghana } from "@/lib/utils/phone-client";
import { OtpBoxes } from "@/components/auth/otp-boxes";
import {
  formatDurationMinutes,
  useSecondsCountdown,
} from "@/hooks/use-seconds-countdown";
import {
  PixelButton,
  PixelCard,
  PixelEmailInput,
  PixelInput,
  PixelLabel,
  PixelPasswordInput,
} from "@/components/pixel/pixel-ui";

type Channel = "email" | "phone";
type Step = "request" | "reset";

const EXPIRY_MINUTES = Math.ceil(AUTH_OTP.EXPIRES_IN_SECONDS / 60);
const COOLDOWN_LABEL = formatDurationMinutes(AUTH_OTP.RESEND_COOLDOWN_SECONDS);

export function ForgotPasswordForm({
  loginHref = "/login",
  variant = "primary",
}: {
  loginHref?: string;
  variant?: "primary" | "dark";
}) {
  const router = useRouter();
  const [channel, setChannel] = React.useState<Channel>("email");
  const [step, setStep] = React.useState<Step>("request");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [forceEmailError, setForceEmailError] = React.useState(false);
  /** Absolute timestamps for live countdown UI */
  const [resendEndsAt, setResendEndsAt] = React.useState<number | null>(null);
  const [expiresEndsAt, setExpiresEndsAt] = React.useState<number | null>(null);

  const resend = useSecondsCountdown(resendEndsAt);
  const expires = useSecondsCountdown(expiresEndsAt);

  const startTimers = () => {
    const now = Date.now();
    setResendEndsAt(now + AUTH_OTP.RESEND_COOLDOWN_SECONDS * 1000);
    setExpiresEndsAt(now + AUTH_OTP.EXPIRES_IN_SECONDS * 1000);
  };

  const resolvePhone = (): string | null => {
    const e164 = toE164Ghana(phone.trim());
    if (!e164) {
      toast.error("Enter a valid Ghana phone number (e.g. 0241234567).");
      return null;
    }
    return e164;
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resend.active) {
      toast.error(`Wait ${resend.label} before requesting another code.`);
      return;
    }
    if (channel === "email" && getEmailError(email)) {
      setForceEmailError(true);
      return;
    }
    setIsLoading(true);
    try {
      if (channel === "email") {
        const { error } = await authClient.emailOtp.requestPasswordReset({
          email: email.trim(),
        });
        if (error) {
          toast.error(error.message || "Could not send reset code.");
          return;
        }
        toast.success(`Code sent. Valid for ${EXPIRY_MINUTES} minutes.`);
      } else {
        const phoneNumber = resolvePhone();
        if (!phoneNumber) return;
        setPhone(phoneNumber);
        const { error } = await authClient.phoneNumber.requestPasswordReset({
          phoneNumber,
        });
        if (error) {
          toast.error(error.message || "Could not send reset code.");
          return;
        }
        toast.success(`Code sent by SMS. Valid for ${EXPIRY_MINUTES} minutes.`);
      }
      setOtp("");
      setStep("reset");
      startTimers();
    } catch {
      toast.error("Could not send reset code. Check configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resend.active || isLoading) return;
    setIsLoading(true);
    try {
      if (channel === "email") {
        const { error } = await authClient.emailOtp.requestPasswordReset({
          email: email.trim(),
        });
        if (error) {
          toast.error(error.message || "Could not resend code.");
          return;
        }
      } else {
        const phoneNumber = resolvePhone();
        if (!phoneNumber) return;
        const { error } = await authClient.phoneNumber.requestPasswordReset({
          phoneNumber,
        });
        if (error) {
          toast.error(error.message || "Could not resend code.");
          return;
        }
      }
      setOtp("");
      toast.success(`New code sent. Valid for ${EXPIRY_MINUTES} minutes.`);
      startTimers();
    } catch {
      toast.error("Resend failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\D/g, "").length !== AUTH_OTP.LENGTH) {
      toast.error(`Enter the full ${AUTH_OTP.LENGTH}-digit code.`);
      return;
    }
    if (expires.done && expiresEndsAt != null) {
      toast.error("This code has expired. Request a new one.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (channel === "email") {
        const { error } = await authClient.emailOtp.resetPassword({
          email: email.trim(),
          otp: otp.trim(),
          password,
        });
        if (error) {
          toast.error(otpErrorMessage(error, "Invalid OTP code."));
          if (
            error.code === "OTP_EXPIRED" ||
            (error.message ?? "").toLowerCase().includes("expired")
          ) {
            setExpiresEndsAt(Date.now());
          }
          return;
        }
      } else {
        const phoneNumber = resolvePhone() ?? phone.trim();
        const { error } = await authClient.phoneNumber.resetPassword({
          phoneNumber,
          otp: otp.trim(),
          newPassword: password,
        });
        if (error) {
          toast.error(otpErrorMessage(error, "Invalid OTP code."));
          if (
            error.code === "OTP_EXPIRED" ||
            (error.message ?? "").toLowerCase().includes("expired")
          ) {
            setExpiresEndsAt(Date.now());
          }
          return;
        }
      }
      toast.success("Password updated. You can sign in now.");
      router.push(loginHref);
    } catch {
      toast.error("Could not reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PixelCard bolts className="p-6 sm:p-8">
      <div className="mb-5 space-y-1 text-left">
        <h1 className="text-sm font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
          Reset password
        </h1>
        <p className="text-[11px] font-semibold text-teal-900/50 dark:text-teal-100/50">
          Codes expire in {EXPIRY_MINUTES} minutes · resend after {COOLDOWN_LABEL} ·
          max {AUTH_OTP.ALLOWED_ATTEMPTS} tries.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setChannel("email");
            setStep("request");
            setOtp("");
          }}
          className={`border-2 px-2 py-2 text-[9px] font-black uppercase tracking-widest ${
            channel === "email"
              ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
              : "border-teal-900/20 text-teal-900/50 dark:border-teal-100/20 dark:text-teal-100/50"
          }`}
        >
          Email OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setChannel("phone");
            setStep("request");
            setOtp("");
          }}
          className={`border-2 px-2 py-2 text-[9px] font-black uppercase tracking-widest ${
            channel === "phone"
              ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
              : "border-teal-900/20 text-teal-900/50 dark:border-teal-100/20 dark:text-teal-100/50"
          }`}
        >
          Phone OTP
        </button>
      </div>

      {step === "request" ? (
        <form onSubmit={handleRequest} className="space-y-4 text-left" noValidate>
          {channel === "email" ? (
            <div className="space-y-1.5">
              <PixelLabel htmlFor="reset-email">Email address</PixelLabel>
              <PixelEmailInput
                id="reset-email"
                placeholder="you@uni.edu.gh"
                value={email}
                onChange={setEmail}
                forceShowError={forceEmailError}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <PixelLabel htmlFor="reset-phone">Phone number</PixelLabel>
              <PixelInput
                id="reset-phone"
                type="tel"
                placeholder="0241234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
          )}
          <PixelButton
            type="submit"
            variant={variant}
            size="lg"
            className="w-full"
            disabled={isLoading || resend.active}
          >
            {isLoading
              ? "Sending..."
              : resend.active
                ? `Resend in ${resend.label}`
                : "Send reset code"}
          </PixelButton>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-5 text-left">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <PixelLabel htmlFor="reset-otp">One-time code</PixelLabel>
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
              id="reset-otp"
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
              onClick={handleResend}
              disabled={isLoading || resend.active}
            >
              {resend.active
                ? `Resend available in ${resend.label}`
                : "Resend code"}
            </PixelButton>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="new-password">New password</PixelLabel>
            <PixelPasswordInput
              id="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="confirm-password">Confirm password</PixelLabel>
            <PixelPasswordInput
              id="confirm-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <PixelButton
            type="submit"
            variant={variant}
            size="lg"
            className="w-full"
            disabled={
              isLoading ||
              expires.done ||
              otp.replace(/\D/g, "").length !== AUTH_OTP.LENGTH
            }
          >
            {isLoading ? "Updating..." : "Set new password"}
          </PixelButton>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setOtp("");
              setPassword("");
              setConfirm("");
            }}
            className="w-full text-[10px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
          >
            Use a different {channel === "email" ? "email" : "phone"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-[10px] font-semibold text-teal-900/40 dark:text-teal-100/40">
        Remembered it?{" "}
        <Link
          href={loginHref}
          className="font-black text-teal-700 underline dark:text-teal-300"
        >
          Back to sign in
        </Link>
      </p>
    </PixelCard>
  );
}
