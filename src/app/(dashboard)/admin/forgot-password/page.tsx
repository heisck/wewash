"use client";

import Link from "next/link";
import { AuthFrame } from "@/components/pixel/auth-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

/**
 * Operator password reset — email OTP (Gmail) or phone OTP (Arkesel SMS).
 * Lives under /admin so the ops branding matches login.
 */
export default function AdminForgotPasswordPage() {
  return (
    <AuthFrame
      word="R3SET"
      sub="OPERATOR RECOVERY"
      machineSrc="/images/machine-open.webp"
      machineAlt="Open washing machine"
      footer={
        <>
          <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
            Use the email or phone on your admin account. Codes last 10 minutes;
            resend is available after 10 minutes.
          </p>
          <Link
            href="/admin"
            className="text-[11px] font-black uppercase tracking-widest text-teal-700 underline decoration-2 underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
          >
            Back to ops login
          </Link>
        </>
      }
    >
      <ForgotPasswordForm loginHref="/admin" variant="dark" />
    </AuthFrame>
  );
}
