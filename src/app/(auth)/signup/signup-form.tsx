"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GoogleGlyph } from "@/components/pixel/auth-frame";
import {
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
  PixelSelect,
} from "@/components/pixel/pixel-ui";

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hall, setHall] = useState("ATLANTIC");
  const [room, setRoom] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate registration and drop straight into the Student Dashboard
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Welcome aboard, ${fullName.split(" ")[0] || "friend"}! Your rotation slot is ready.`);
      router.push("/student");
    }, 1100);
  };

  return (
    <PixelCard bolts className="p-6 sm:p-8">
      <PixelButton
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => router.push("/student")}
      >
        <GoogleGlyph className="h-4 w-4" />
        Sign up with Google
      </PixelButton>

      {/* Divider */}
      <div className="flex items-center gap-3 py-6" aria-hidden="true">
        <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-900/40 dark:text-teal-100/40">
          or
        </span>
        <span className="h-0.5 flex-1 bg-teal-900/15 dark:bg-teal-100/15" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        <div className="space-y-2">
          <PixelLabel htmlFor="fullName">Full name</PixelLabel>
          <PixelInput
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <PixelLabel htmlFor="phone">Phone number</PixelLabel>
          <div className="flex">
            <span className="flex h-11 shrink-0 items-center border-2 border-r-0 border-teal-900/30 bg-teal-600/10 px-3 text-xs font-black tracking-widest text-teal-800 dark:border-teal-100/25 dark:bg-teal-400/10 dark:text-teal-200">
              +233
            </span>
            <PixelInput
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="24 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="hall">Hall</PixelLabel>
            <PixelSelect id="hall" value={hall} onChange={(e) => setHall(e.target.value)}>
              <option value="ATLANTIC">Atlantic Hall</option>
              <option value="CASFORD">Casford Hall</option>
              <option value="OGUAA">Oguaa Hall</option>
              <option value="VALCO">Valco Hall</option>
            </PixelSelect>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="room">Room</PixelLabel>
            <PixelInput
              id="room"
              placeholder="104"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            />
          </div>
        </div>

        <PixelButton type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </PixelButton>

        <p className="text-center text-[10px] font-semibold text-teal-900/40 dark:text-teal-100/40">
          GHS 50 one-time setup - GHS 35/week shared dues
        </p>
      </form>
    </PixelCard>
  );
}
