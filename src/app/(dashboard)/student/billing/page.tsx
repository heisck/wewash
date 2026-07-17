"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Calendar, CheckCircle, Upload, ImageIcon } from "lucide-react";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel,
  PixelTd, PixelTh, SectionTitle, StatTile,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type {
  ContactConfig,
  MeResponse,
  PaymentDTO,
  WeekDuesStatus,
} from "@/lib/types/client";

const cedis = (n: string | number) => {
  const v = typeof n === "string" ? Number(n) : n;
  return `₵${(Number.isFinite(v) ? v : 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
};

function statusTone(status: PaymentDTO["status"]) {
  if (status === "COMPLETED") return "green" as const;
  if (status === "PENDING") return "amber" as const;
  if (status === "FAILED" || status === "CANCELLED") return "red" as const;
  return "slate" as const;
}

export default function BillingPage() {
  const { data: me } = useApi<MeResponse>("/api/v1/me");
  const hasStudent = !!me?.student;
  const { data: dues, reload: reloadDues } = useApi<WeekDuesStatus>(
    hasStudent ? "/api/v1/me/dues" : null
  );
  const { data: payments, reload, loading } = useApi<PaymentDTO[]>(
    hasStudent ? "/api/v1/payments?limit=50" : null
  );
  const { data: contact } = useApi<ContactConfig>("/api/v1/public/contact");
  const list = payments ?? [];
  const weekly = dues?.weeklyAmount ?? Number(me?.student?.weeklyAmount ?? 0);
  const paidWeek = dues?.paidThisWeek ?? 0;
  const remaining = dues?.remaining ?? Math.max(0, weekly - paidWeek);
  const full = dues?.isPaidInFull ?? (weekly <= 0 || paidWeek >= weekly);
  const weekLabel =
    dues?.weekStart && dues?.weekEnd
      ? `${new Date(dues.weekStart).toLocaleDateString()} – ${new Date(dues.weekEnd).toLocaleDateString()}`
      : "This Mon–Sun week";

  const totals = useMemo(() => {
    let paidAll = 0;
    let pending = 0;
    for (const p of list) {
      const amt = Number(p.amountPaid ?? p.amount ?? 0);
      if (p.status === "COMPLETED") paidAll += amt;
      if (p.status === "PENDING") pending += amt;
    }
    return { paidAll, pending };
  }, [list]);

  const refresh = () => {
    reload();
    reloadDues();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="PAYMENTS"
          sub="Weekly dues · pay in pieces or full · admin confirms each proof"
        />
        {full ? (
          <PixelBadge tone="green">PAID IN FULL THIS WEEK</PixelBadge>
        ) : (
          <PixelBadge tone="amber">BALANCE DUE THIS WEEK</PixelBadge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Weekly fee"
          value={cedis(weekly)}
          sub="Set by admin at registration"
          icon={<CreditCard />}
        />
        <StatTile
          label="Paid this week"
          value={cedis(paidWeek)}
          sub={full ? "Full — overpay OK" : "Confirmed pieces only"}
          icon={<CheckCircle />}
        />
        <StatTile
          label="Remaining this week"
          value={cedis(remaining)}
          sub={full ? "Nothing left" : "Until full"}
          icon={<Calendar />}
        />
        <StatTile
          label="Total confirmed (all time)"
          value={cedis(totals.paidAll)}
          sub={
            totals.pending > 0
              ? `${cedis(totals.pending)} awaiting review`
              : "All proofs settled"
          }
          icon={<CheckCircle />}
        />
      </div>

      <PixelCard className="border-2 border-teal-900/15 bg-teal-600/5 p-4 dark:border-teal-100/15">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-900/45">
          Billing week
        </p>
        <p className="mt-1 text-xs font-bold text-teal-950 dark:text-teal-50">
          {weekLabel}
        </p>
        {!full ? (
          <p className="mt-2 text-xs font-bold text-teal-950 dark:text-teal-50">
            Fee is <span className="font-black">{cedis(weekly)}</span>. Pay off-app in pieces —
            each admin-confirmed amount adds up until you are paid in full.
          </p>
        ) : (
          <p className="mt-2 text-xs font-bold text-teal-800 dark:text-teal-200">
            You are paid in full for this week. You can still submit another proof if you overpay.
          </p>
        )}
        {(contact?.phone || contact?.whatsapp || contact?.email) && (
          <p className="mt-2 text-[11px] font-semibold text-teal-900/55 dark:text-teal-100/55">
            Pay via admin
            {contact.phone ? ` · ${contact.phone}` : ""}
            {contact.whatsapp ? ` · WhatsApp ${contact.whatsapp}` : ""}
            {contact.email ? ` · ${contact.email}` : ""}
            , then upload the screenshot below.
          </p>
        )}
      </PixelCard>

      {!me?.student ? (
        <PixelCard className="p-6 text-center text-[11px] font-semibold text-teal-900/50">
          No student profile linked — payments cannot be submitted until admin registers you.
        </PixelCard>
      ) : (
        <SubmitProofCard
          weekly={weekly}
          remaining={remaining}
          onDone={refresh}
        />
      )}

      <div className="space-y-4">
        <SectionTitle text="YOUR PAYMENTS" />
        <PixelCard className="overflow-x-auto">
          {loading && !payments ? (
            <p className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              Loading…
            </p>
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              No payments yet. Submit proof after you pay off-app.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
                  <PixelTh className="pt-4">Amount</PixelTh>
                  <PixelTh className="pt-4">Method</PixelTh>
                  <PixelTh className="pt-4">Reference</PixelTh>
                  <PixelTh className="pt-4">Proof</PixelTh>
                  <PixelTh className="pt-4">Date</PixelTh>
                  <PixelTh className="pt-4">Status</PixelTh>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
                {list.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5"
                  >
                    <PixelTd className="font-black">
                      {cedis(tx.amountPaid ?? tx.amount)}
                    </PixelTd>
                    <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                      {tx.method.replace(/_/g, " ")}
                    </PixelTd>
                    <PixelTd className="text-[10px]">
                      {tx.reference || tx.momoTransactionId || "—"}
                    </PixelTd>
                    <PixelTd>
                      {tx.receiptUrl ? (
                        <a
                          href={tx.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-700 underline dark:text-teal-300"
                        >
                          <ImageIcon className="h-3 w-3" /> View
                        </a>
                      ) : (
                        "—"
                      )}
                    </PixelTd>
                    <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                      {tx.paidAt
                        ? new Date(tx.paidAt).toLocaleDateString()
                        : new Date(tx.createdAt).toLocaleDateString()}
                    </PixelTd>
                    <PixelTd>
                      <PixelBadge tone={statusTone(tx.status)}>{tx.status}</PixelBadge>
                    </PixelTd>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PixelCard>
      </div>
    </div>
  );
}

function SubmitProofCard({
  weekly,
  remaining,
  onDone,
}: {
  weekly: number;
  remaining: number;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (remaining > 0) setAmount(String(remaining));
    else if (weekly > 0) setAmount(String(weekly));
  }, [remaining, weekly]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "receipts");
      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Upload failed");
      }
      setReceiptUrl(json.data.url as string);
      toast.success("Screenshot uploaded.");
    } catch (err) {
      toast.error((err as Error).message || "Could not upload screenshot.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUrl) {
      toast.error("Upload a payment screenshot first.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/v1/payments", {
        amountPaid: Number(amount),
        amount: Number(amount),
        amountDue: weekly || Number(amount),
        method: "OTHER",
        receiptUrl,
        notes: notes || undefined,
        status: "PENDING",
      });
      toast.success("Proof submitted. After admin confirms, it counts toward this week.");
      setNotes("");
      setReceiptUrl("");
      onDone();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not submit proof.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PixelCard className="p-5 sm:p-6">
      <SectionTitle text="SUBMIT PAYMENT PROOF" />
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-teal-900/60 dark:text-teal-100/60">
        Pay any amount toward this week’s fee (full or partial). Admin confirms each screenshot;
        confirmed amounts add up until you reach the weekly fee.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <PixelLabel htmlFor="amt">Amount paid (GHS)</PixelLabel>
          <PixelInput
            id="amt"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {remaining > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
              Remaining this week: {cedis(remaining)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <PixelLabel htmlFor="notes">Note (optional)</PixelLabel>
          <PixelInput
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. partial · MoMo name"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <PixelLabel>Screenshot</PixelLabel>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-teal-900/25 bg-teal-600/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider dark:border-teal-100/25">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {receiptUrl ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-black uppercase tracking-wider text-teal-700 underline dark:text-teal-300"
              >
                Preview screenshot
              </a>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-900/40">
                Required
              </span>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <PixelButton type="submit" disabled={saving || uploading || !receiptUrl}>
            {saving ? "Submitting…" : "Submit for confirmation"}
          </PixelButton>
        </div>
      </form>
    </PixelCard>
  );
}
