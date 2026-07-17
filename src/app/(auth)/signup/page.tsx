import Link from "next/link";
import { AuthFrame } from "@/components/pixel/auth-frame";
import { PixelCard, PixelButton } from "@/components/pixel/pixel-ui";

export const metadata = {
  title: "Student accounts | WeWash",
  description: "Student accounts are created by WeWash administrators only.",
};

/**
 * Public self-signup is disabled. Student accounts are provisioned by admins
 * with an assigned email; students only sign in.
 */
export default function SignupPage() {
  return (
    <AuthFrame
      word="J@IN"
      sub="BY ADMIN INVITE ONLY"
      machineSrc="/images/machine-clothes.webp"
      machineAlt="Washing machine with clothes"
      footer={
        <>
          <p className="max-w-[320px] text-[11px] font-semibold leading-normal text-teal-900/50 dark:text-teal-100/50">
            Read our{" "}
            <Link href="/terms" className="underline hover:text-teal-800 dark:hover:text-teal-200">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-teal-800 dark:hover:text-teal-200">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-teal-900/60 dark:text-teal-100/60">
            Already registered?{" "}
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
      <PixelCard bolts className="space-y-5 p-6 text-left sm:p-8">
        <div className="space-y-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-teal-950 dark:text-teal-50">
            Accounts are admin-created
          </h2>
          <p className="text-[12px] font-semibold leading-relaxed text-teal-900/70 dark:text-teal-100/70">
            Students cannot create WeWash accounts themselves. Your administrator registers you with
            your official email. Sign in with that email and the password you were given (or use the
            options on the login screen).
          </p>
        </div>
        <Link href="/login" className="block">
          <PixelButton variant="dark" size="lg" className="w-full">
            Go to student login
          </PixelButton>
        </Link>
        <Link href="/contact" className="block">
          <PixelButton variant="outline" size="lg" className="w-full">
            Contact administrator
          </PixelButton>
        </Link>
      </PixelCard>
    </AuthFrame>
  );
}
