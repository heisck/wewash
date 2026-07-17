import Link from "next/link";
import { AuthFrame } from "@/components/pixel/auth-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset password | WeWash",
  description: "Reset your WeWash password with an email or phone OTP.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      word="R3SET"
      sub="EMAIL OR PHONE OTP"
      machineSrc="/images/machine.webp"
      machineAlt="Washing machine"
      footer={
        <>
          <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
            Codes expire in 30 minutes. After 3 wrong tries you must request a new
            code. You can resend only after 10 minutes.
          </p>
          <Link
            href="/login"
            className="text-[11px] font-black uppercase tracking-widest text-teal-700 underline decoration-2 underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
          >
            Back to student login
          </Link>
        </>
      }
    >
      <ForgotPasswordForm loginHref="/login" variant="primary" />
    </AuthFrame>
  );
}
