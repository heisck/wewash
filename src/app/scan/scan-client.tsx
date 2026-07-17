"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanLine, CheckCircle2, Clock, MapPin, ArrowLeft, WashingMachine } from "lucide-react";
import { QrScanner, extractQrToken } from "@/components/scan/qr-scanner";
import { api, ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/client";
import { PixelButton, PixelCard } from "@/components/pixel/pixel-ui";
import type { ScanResult } from "@/lib/types/client";
import { useCountdown } from "@/hooks/use-countdown";

type MachinePeek = {
  id: string;
  serialNumber: string;
  name?: string | null;
  code?: string | null;
  label: string;
  hall?: { code: string; name: string } | null;
};

/**
 * Scan experience. Printed QR opens /scan/{token} on the WeWash site.
 * After login, records: this student has this machine in their room.
 */
export function ScanClient({ token }: { token?: string }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [phase, setPhase] = React.useState<"scan" | "submitting" | "done">(
    token ? "submitting" : "scan"
  );
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [peek, setPeek] = React.useState<MachinePeek | null>(null);
  const submittedRef = React.useRef(false);

  // Load machine identity from token (public) so the page shows which unit.
  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/v1/public/machine-qr/${encodeURIComponent(token)}`, {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!cancelled && json?.success && json.data) setPeek(json.data as MachinePeek);
      } catch {
        /* ignore — scan can still work */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
        toast.success(res.message || "Machine is in your hands!");
      } catch (e) {
        submittedRef.current = false;
        const err = e as ApiError;
        if (err.status === 401) {
          const cb = token ? `/scan/${token}` : "/scan";
          router.push(`/login?callbackURL=${encodeURIComponent(cb)}`);
          return;
        }
        toast.error(err.message || "Could not register that scan.");
        setPhase(token ? "submitting" : "scan");
        // Allow retry for deep-link after error
        if (token) setPhase("scan");
      }
    },
    [router, token]
  );

  // Deep-link: submit once session is known.
  React.useEffect(() => {
    if (token && !isPending) {
      if (!session) {
        router.push(`/login?callbackURL=${encodeURIComponent(`/scan/${token}`)}`);
        return;
      }
      submit(token);
    }
  }, [token, isPending, session, submit, router]);

  const machineTitle =
    result?.machine &&
    ((result.machine as { label?: string }).label ||
      result.machine.code ||
      result.machine.name ||
      result.machine.serialNumber);

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
            <ScanLine className="h-3.5 w-3.5" /> WeWash scan
          </span>
        </div>

        {/* Always show which machine when we know it */}
        {(peek || machineTitle) && phase !== "done" && (
          <PixelCard className="mb-4 flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-teal-900/25 bg-teal-600 text-white">
              <WashingMachine className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/45">
                Machine
              </p>
              <p className="truncate text-sm font-black uppercase tracking-wide text-teal-950 dark:text-white">
                {peek?.label || machineTitle}
              </p>
              {peek?.serialNumber && peek.label !== peek.serialNumber && (
                <p className="text-[10px] font-mono text-teal-900/50">{peek.serialNumber}</p>
              )}
              {peek?.hall?.code && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                  {peek.hall.name || peek.hall.code}
                </p>
              )}
            </div>
          </PixelCard>
        )}

        {phase !== "done" ? (
          <PixelCard bolts className="p-5">
            {phase === "submitting" ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <img src="/favicon.ico" alt="" className="h-10 w-10 animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  Claiming machine…
                </p>
                <p className="max-w-xs text-center text-[10px] font-semibold text-teal-900/50">
                  Linking this unit to you and your room
                </p>
              </div>
            ) : (
              <>
                <QrScanner onResult={submit} />
                <p className="mt-4 text-center text-[11px] font-semibold leading-relaxed text-teal-900/60 dark:text-teal-100/60">
                  {token
                    ? "Sign in was required — try scanning again or wait for auto-claim."
                    : "Point your camera at the QR sticker on the washing machine."}
                </p>
                {token && (
                  <PixelButton
                    className="mt-4 w-full"
                    onClick={() => {
                      submittedRef.current = false;
                      void submit(token);
                    }}
                  >
                    Claim this machine
                  </PixelButton>
                )}
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
  const machineLabel =
    (result.machine as { label?: string }).label ||
    result.machine.code ||
    result.machine.name ||
    result.machine.serialNumber;
  const studentName = (result as ScanResult & {
    student?: { firstName: string; lastName: string };
  }).student;
  const message = (result as ScanResult & { message?: string }).message;

  return (
    <PixelCard bolts className="p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-teal-950/60 bg-teal-400 text-teal-950">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-black uppercase tracking-wide text-teal-950 dark:text-teal-50">
        Machine claimed
      </h1>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
        {machineLabel}
      </p>
      {message && (
        <p className="mt-2 text-xs font-semibold text-teal-900/70 dark:text-teal-100/70">
          {message}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <Stat
          icon={<MapPin className="h-4 w-4" />}
          label="Your room"
          value={result.room ? `Room ${result.room.number}` : "—"}
          sub={result.hall?.code}
        />
        <Stat
          icon={<Clock className="h-4 w-4" />}
          label="Handoff in"
          value={label}
          sub="until next room"
        />
      </div>

      {studentName && (
        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-teal-900/45">
          Scanned by {studentName.firstName} {studentName.lastName}
        </p>
      )}

      <div
        className={`mt-4 border-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest ${
          late > 0
            ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "border-teal-600/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
        }`}
      >
        {late > 0
          ? `Picked up ${formatMins(late)} into the rotation window`
          : "Recorded on the system — machine is with you"}
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
      {sub && (
        <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
          {sub}
        </p>
      )}
    </div>
  );
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
