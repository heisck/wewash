"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GoogleGlyph } from "@/components/pixel/auth-frame";
import { authClient } from "@/lib/auth/client";
import { api } from "@/lib/api/client";
import { toE164Ghana } from "@/lib/utils/phone-client";
import {
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
  PixelSelect,
} from "@/components/pixel/pixel-ui";

type Hall = { id: string; name: string; code: string };

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [halls, setHalls] = useState<Hall[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [hallId, setHallId] = useState("");
  const [room, setRoom] = useState("");

  useEffect(() => {
    api
      .get<Hall[]>("/api/v1/public/halls")
      .then((data) => {
        setHalls(data);
        if (data[0]) setHallId(data[0].id);
      })
      .catch(() => {
        /* halls optional; admin may not have added any yet */
      });
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/student" });
    } catch {
      setGoogleLoading(false);
      toast.error("Could not start Google sign-up. Is it configured?");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164Ghana(phone);
    if (!e164) return toast.error("Enter a valid Ghana phone number.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");

    setIsLoading(true);
    // 1) Create the auth account
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: fullName,
      // additional fields declared on the server
      phone: e164,
    } as Parameters<typeof authClient.signUp.email>[0]);

    if (error) {
      setIsLoading(false);
      return toast.error(error.message || "Could not create account.");
    }

    // 2) Create the student profile + hostel/room link
    try {
      await api.post("/api/v1/onboarding", {
        studentId: studentId.trim(),
        phone: e164,
        hallId: hallId || undefined,
        roomNumber: room.trim() || undefined,
      });
    } catch {
      // Account exists; profile can be completed later in Settings.
      toast.message("Account created — finish your room details in Settings.");
      setIsLoading(false);
      return router.push("/student");
    }

    setIsLoading(false);
    toast.success(`Welcome aboard, ${fullName.split(" ")[0] || "friend"}! Your rotation slot is ready.`);
    router.push("/student");
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
        {googleLoading ? "Redirecting..." : "Sign up with Google"}
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="email">Email</PixelLabel>
            <PixelInput
              id="email"
              type="email"
              placeholder="john@uni.edu.gh"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="password">Password</PixelLabel>
            <PixelInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="studentId">Student ID</PixelLabel>
            <PixelInput
              id="studentId"
              placeholder="UCC/2024/0001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
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
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="hall">Hostel</PixelLabel>
            <PixelSelect id="hall" value={hallId} onChange={(e) => setHallId(e.target.value)}>
              {halls.length === 0 && <option value="">No halls yet</option>}
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </PixelSelect>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="room">Room</PixelLabel>
            <PixelInput
              id="room"
              placeholder="104"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
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
