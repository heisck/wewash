import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata = {
  title: "Welcome to WeWash | Sign In",
  description: "Access your hostel's shared washing machine subscription.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 py-12">
      {/* Top Brand Logo */}
      <div className="absolute top-8">
        <img src="/favicon.ico" alt="WeWash Logo" className="h-8 w-8 object-contain" />
      </div>

      <div className="w-full max-w-[400px] flex flex-col items-center text-center">
        {/* Rounded Accent Icon */}
        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xs border border-slate-200/50 dark:border-slate-800">
          <img src="/favicon.ico" alt="WeWash Logo" className="h-9 w-9 object-contain" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8">
          Welcome back
        </h1>

        {/* Student LoginForm */}
        <LoginForm />

        {/* Policy disclaimer */}
        <p className="text-[11px] text-slate-400 leading-normal mt-6 max-w-[320px]">
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>.
        </p>

        {/* Footer link */}
        <p className="text-xs text-slate-500 mt-8">
          Don't have an account?{" "}
          <Link href="/#pricing" className="text-blue-600 font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
