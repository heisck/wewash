"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Calendar, CheckCircle, Upload, ImageIcon } from "lucide-react";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel, PixelSelect,
  PixelTd, PixelTh, SectionTitle, StatTile,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { MeResponse, PaymentDTO } from "@/lib/types/client";

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
  const { data: payments, reload, loading } = useApi<PaymentDTO[]>("/api/v1/payments?limit=50");
  const list = payments ?? [];
  const weekly = Number(me?.student?.weeklyAmount ?? 0);

  const totals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const p of list) {
      const amt = Number(p.amountPaid ?? p.amount ?? 0);
      if (p.status === "COMPLETED") paid += amt;
      if (p.status === "PENDING") pending += amt;
    }
    return { paid, pending };
  }, [list]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="PAYMENTS"
          sub="Pay off-app, upload proof — admin confirms"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Weekly rate"
          value={cedis(weekly)}
          sub="Set by hall admin"
          icon={<CreditCard />}
        />
        <StatTile
          label="Confirmed paid"
          value={cedis(totals.paid)}
          sub="Completed proofs"
          icon={<CheckCircle />}
        />
        <StatTile
          label="Awaiting review"
          value={cedis(totals.pending)}
          sub={totals.pending > 0 ? "Admin will verify" : "None pending"}
          icon={<Calendar />}
        />
      </div>

      <SubmitProofCard
        weekly={weekly}
        onDone={() => {
          reload();
        }}
      />

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

function SubmitProofCard({ weekly, onDone }: { weekly: number; onDone: () => void }) {
  const [amount, setAmount] = useState(weekly > 0 ? String(weekly) : "");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        method,
        reference: reference || undefined,
        receiptUrl,
        notes: notes || undefined,
        status: "PENDING",
      });
      toast.success("Proof submitted. Admin will confirm the amount.");
      setReference("");
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
        Pay off-app (MoMo, bank, crypto P2P, etc.), then upload a screenshot and the amount
        you paid. Access and push rotation alerts unlock after an admin confirms.
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
        </div>
        <div className="space-y-2">
          <PixelLabel htmlFor="method">How you paid</PixelLabel>
          <PixelSelect id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other / crypto P2P</option>
          </PixelSelect>
        </div>
        <div className="space-y-2">
          <PixelLabel htmlFor="ref">Transaction reference (optional)</PixelLabel>
          <PixelInput
            id="ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="MoMo ID / Txn hash"
          />
        </div>
        <div className="space-y-2">
          <PixelLabel htmlFor="notes">Notes (optional)</PixelLabel>
          <PixelInput
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Binance P2P to +233…"
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
