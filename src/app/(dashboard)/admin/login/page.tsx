"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthFrame, GoogleGlyph } from "@/components/pixel/auth-frame";
import {
  PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate admin login and redirect to the Admin Overview
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Signed in. Operations are live.");
      router.push("/admin");
    }, 1000);
  };

  return (
    <AuthFrame
      word="@DMIN"
      sub="LIVE APPLIANCE OPERATIONS & ROSTERS"
      machineSrc="/images/machine-open.webp"
      machineAlt="Open washing machine standing in for a letter"
      footer={
        <Link
          href="/login"
          className="text-[11px] font-black uppercase tracking-widest text-teal-700 underline decoration-2 underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
        >
          Access student portal
        </Link>
      }
    >
      <PixelCard bolts className="p-6 sm:p-8">
        <PixelButton
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => router.push("/admin")}
        >
          <GoogleGlyph className="h-4 w-4" />
          Continue with Google
        </PixelButton>

        <div className="flex items-center gap-3 py-6" aria-hidden="true">
          <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-900/40 dark:text-teal-100/40">
            or
          </span>
          <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <PixelLabel htmlFor="email">Email address</PixelLabel>
            <PixelInput
              id="email"
              type="email"
              placeholder="admin@wewash.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <PixelLabel htmlFor="password">Password</PixelLabel>
              <a
                href="#"
                className="text-[9px] font-black uppercase tracking-widest text-teal-700 hover:underline dark:text-teal-300"
              >
                Forgot?
              </a>
            </div>
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
            {isLoading ? "Signing in..." : "Sign in as admin"}
          </PixelButton>
        </form>
      </PixelCard>
    </AuthFrame>
  );
}
