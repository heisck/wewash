import Link from "next/link";
import { AuthFrame } from "@/components/pixel/auth-frame";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Welcome to WeWash | Sign In",
  description: "Access your hostel's shared washing machine subscription.",
};

export default function LoginPage() {
  return (
    <AuthFrame
      word="L@GIN"
      sub="WELCOME BACK, KEEP IT SPINNING"
      machineSrc="/images/machine.webp"
      machineAlt="Washing machine standing in for the letter O"
      footer={
        <>
          <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-teal-800 dark:hover:text-teal-200">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-teal-800 dark:hover:text-teal-200">
              Privacy Policy
            </Link>
            . Student accounts are created by your administrator.
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-teal-900/60 dark:text-teal-100/60">
            Need access?{" "}
            <Link
              href="/contact"
              className="text-teal-700 underline decoration-2 underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Contact admin
            </Link>
          </p>
          <Link
            href="/admin"
            className="text-[10px] font-bold uppercase tracking-widest text-teal-900/40 hover:text-teal-800 dark:text-teal-100/40 dark:hover:text-teal-200"
          >
            Admin operations center →
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthFrame>
  );
}
