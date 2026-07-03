import Link from "next/link";
import { AuthFrame } from "@/components/pixel/auth-frame";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Join WeWash | Sign Up",
  description: "Subscribe to your hostel's shared washing machine rotation.",
};

export default function SignupPage() {
  return (
    <AuthFrame
      word="J@IN"
      sub="US, LIFE CAN BE EASIER"
      machineSrc="/images/machine-clothes.webp"
      machineAlt="Washing machine with clothes standing in for the letter O"
      footer={
        <>
          <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
            By signing up, you agree to our{" "}
            <a href="#" className="underline hover:text-teal-800 dark:hover:text-teal-200">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-teal-800 dark:hover:text-teal-200">
              Privacy Policy
            </a>
            .
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-teal-900/60 dark:text-teal-100/60">
            Already in?{" "}
            <Link
              href="/login"
              className="text-teal-700 underline decoration-2 underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Log in
            </Link>
          </p>
        </>
      }
    >
      <SignupForm />
    </AuthFrame>
  );
}
