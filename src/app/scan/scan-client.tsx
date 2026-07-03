"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanLine, CheckCircle2, Clock, MapPin, ArrowLeft } from "lucide-react";
import { QrScanner, extractQrToken } from "@/components/scan/qr-scanner";
import { api, ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/client";
import { PixelButton, PixelCard } from "@/components/pixel/pixel-ui";
import type { ScanResult } from "@/lib/types/client";
import { useCountdown } from "@/hooks/use-countdown";

/**
 * Shared scan experience. If `token` is provided (deep-link from a printed QR),
 * it's submitted immediately; otherwise the live camera scanner opens.
 */
export function ScanClient({ token }: { token?: string }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [phase, setPhase] = React.useState<"scan" | "submitting" | "done">(
    token ? "submitting" : "scan"
  );
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const submittedRef = React.useRef(false);

  const submit = React.useCallback(
    async (rawToken: string) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");
      try {
        const qrToken = extractQrToken(rawToken);
        const res = await api.post<ScanResult>("/api/v1/scan", { qrToken });
        setResult(res);
        setPhase("done");
        toast.success("Machine is in your hands!");
      } catch (e) {
        submittedRef.current = false;
        const err = e as ApiError;
        if (err.status === 401) {
          const cb = token ? `/scan/${token}` : "/scan";
          router.push(`/login?callbackURL=${encodeURIComponent(cb)}`);
          return;
        }
        toast.error(err.message || "Could not register that scan.");
        setPhase("scan");
      }
    },
    [router, token]
  );

  // Deep-link: submit the token once the session is known.
  React.useEffect(() => {
    if (token && !isPending) {
      if (!session) {
        router.push(`/login?callbackURL=${encodeURIComponent(`/scan/${token}`)}`);
        return;
      }
      submit(token);
    }
  }, [token, isPending, session, submit, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfc] to-[#96DED1] px-4 py-8 dark:from-[#0f2d2b] dark:to-[#04100f]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-800 hover:underline dark:text-teal-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
            <ScanLine className="h-3.5 w-3.5" /> Scan machine
          </span>
        </div>

        {phase !== "done" ? (
          <PixelCard bolts className="p-5">
            {phase === "submitting" ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <img src="/favicon.ico" alt="" className="h-10 w-10 animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  Registering scan…
                </p>
              </div>
            ) : (
              <>
                <QrScanner onResult={submit} />
                <p className="mt-4 text-center text-[11px] font-semibold leading-relaxed text-teal-900/60 dark:text-teal-100/60">
                  Point your camera at the QR sticker on the washing machine.
                </p>
              </>
            )}
          </PixelCard>
        ) : (
          result && <ScanResultView result={result} />
        )}
      </div>
    </div>
  );
}

function ScanResultView({ result }: { result: ScanResult }) {
  const { label } = useCountdown(result.session.dueBackAt);
  const late = result.session.minutesLate ?? 0;

  return (
    <PixelCard bolts className="p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-teal-950/60 bg-teal-400 text-teal-950">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-black uppercase tracking-wide text-teal-950 dark:text-teal-50">
        It&apos;s all yours
      </h1>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
        {result.machine.serialNumber}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <Stat
          icon={<MapPin className="h-4 w-4" />}
          label="Location"
          value={result.room ? `Room ${result.room.number}` : "—"}
          sub={result.hall?.code}
        />
        <Stat
          icon={<Clock className="h-4 w-4" />}
          label="Moves in"
          value={label}
          sub="until next room"
        />
      </div>

      <div
        className={`mt-4 border-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest ${
          late > 0
            ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "border-teal-600/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
        }`}
      >
        {late > 0
          ? `You picked it up ${formatMins(late)} into your window`
          : "Right on time — nice one"}
      </div>

      <Link href="/student" className="mt-6 block">
        <PixelButton size="lg" className="w-full">
          Go to dashboard
        </PixelButton>
      </Link>
    </PixelCard>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border-2 border-teal-900/15 bg-white/50 p-3 dark:border-teal-100/15 dark:bg-teal-100/5">
      <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-black text-teal-950 dark:text-teal-50">{value}</p>
      {sub && <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">{sub}</p>}
    </div>
  );
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
