"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GoogleGlyph } from "@/components/pixel/auth-frame";
import { authClient, safeSignOut } from "@/lib/auth/client";
import { getEmailError } from "@/lib/utils/email";
import {
  PixelButton,
  PixelCard,
  PixelEmailInput,
  PixelLabel,
  PixelPasswordInput,
} from "@/components/pixel/pixel-ui";

/** After login: only students with a linked Student row may enter /student. */
async function resolvePostLoginPath(preferred: string): Promise<string> {
  try {
    const res = await fetch("/api/v1/me", { credentials: "same-origin" });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      await safeSignOut();
      throw new Error("Could not verify your account.");
    }
    const role = json.data?.user?.role as string | undefined;
    const student = json.data?.student;
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return preferred.startsWith("/admin") ? preferred : "/admin";
    }
    if (role === "STUDENT" && student && student.isActive !== false) {
      const dest = preferred.startsWith("/student") || preferred.startsWith("/scan")
        ? preferred
        : "/student";
      return dest;
    }
    await safeSignOut();
    throw new Error(
      "No student account is linked to this login. Ask WeWash admin to register you."
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("student account")) throw e;
    throw e instanceof Error ? e : new Error("Could not verify your account.");
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/student";
  const urlError = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forceEmailError, setForceEmailError] = useState(false);

  useEffect(() => {
    if (urlError === "no_student_profile") {
      toast.error(
        "No student account linked to that login. Ask admin to register you."
      );
    } else if (urlError === "student_only") {
      toast.error("Student portal is for registered students only.");
    }
  }, [urlError]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Land on student; layout will kick out accounts without a student profile.
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackURL.startsWith("/admin") ? "/student" : callbackURL,
      });
    } catch {
      setGoogleLoading(false);
      toast.error("Could not start Google sign-in. Is it configured?");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = getEmailError(email);
    if (emailErr) {
      setForceEmailError(true);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message || "Invalid email or password.");
        return;
      }
      const path = await resolvePostLoginPath(callbackURL);
      toast.success(
        path.startsWith("/admin")
          ? "Welcome back."
          : "Welcome back! Machine's all yours."
      );
      router.push(path);
    } catch (err) {
      toast.error(
        (err as Error).message ||
          "No student account linked. Contact WeWash admin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PixelCard bolts className="p-6 sm:p-8">
      <PixelButton
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        <GoogleGlyph className="h-4 w-4" />
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </PixelButton>

      <div className="flex items-center gap-3 py-6" aria-hidden="true">
        <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-900/40 dark:text-teal-100/40">
          or
        </span>
        <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
        <div className="space-y-1.5">
          <PixelLabel htmlFor="email">Email address</PixelLabel>
          <PixelEmailInput
            id="email"
            placeholder="john@uni.edu.gh"
            value={email}
            onChange={setEmail}
            forceShowError={forceEmailError}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <PixelLabel htmlFor="password">Password</PixelLabel>
            <a
              href="/forgot-password"
              className="text-[10px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
            >
              Forgot?
            </a>
          </div>
          <PixelPasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {/* Match email field vertical rhythm (reserved error slot) */}
          <p className="h-4" aria-hidden="true">
            {"\u00a0"}
          </p>
        </div>

        <PixelButton type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Continue"}
        </PixelButton>

        <p className="text-center text-[10px] font-semibold text-teal-900/40 dark:text-teal-100/40">
          New here?{" "}
          <a href="/signup" className="font-black text-teal-700 underline dark:text-teal-300">
            Create an account
          </a>
        </p>
      </form>
    </PixelCard>
  );
}
