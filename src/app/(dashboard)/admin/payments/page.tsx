"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Banknote } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel, PixelSelect,
  PixelTd, PixelTh,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { PaymentDTO, StudentDTO } from "@/lib/types/client";

const cedis = (n: string | number) => {
  const v = typeof n === "string" ? Number(n) : n;
  return `₵${(v || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
};

function paymentBalance(p: PaymentDTO) {
  const due = Number(p.amountDue ?? p.amount ?? 0);
  const paid = Number(p.amountPaid ?? (p.status === "COMPLETED" ? p.amount : 0) ?? 0);
  return { due, paid, outstanding: Math.max(0, due - paid) };
}

export default function AdminPaymentsPage() {
  const { data: payments, reload } = useApi<PaymentDTO[]>("/api/v1/payments?limit=100");
  const { data: students } = useApi<StudentDTO[]>("/api/v1/students?limit=100");
  const [open, setOpen] = useState(false);

  const list = payments ?? [];
  const totals = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    for (const p of list) {
      const b = paymentBalance(p);
      collected += b.paid;
      outstanding += b.outstanding;
    }
    return { collected, outstanding };
  }, [list]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="PAYMENTS" sub="Manual records · paid / partial / outstanding" />
        <PixelButton onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Record payment
        </PixelButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PixelCard className="p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">Collected (list)</p>
          <p className="mt-1 text-2xl font-black text-teal-700 dark:text-teal-300">
            {cedis(totals.collected)}
          </p>
        </PixelCard>
        <PixelCard className="p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">Outstanding (list)</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{cedis(totals.outstanding)}</p>
        </PixelCard>
      </div>

      <PixelCard className="overflow-x-auto">
        {list.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
            <Banknote className="mr-2 h-4 w-4" /> No payments recorded yet.
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b-2 border-teal-900/15">
                <PixelTh className="pt-4">Student</PixelTh>
                <PixelTh className="pt-4">Room</PixelTh>
                <PixelTh className="pt-4">Due</PixelTh>
                <PixelTh className="pt-4">Paid</PixelTh>
                <PixelTh className="pt-4">Status</PixelTh>
                <PixelTh className="pt-4">Reference</PixelTh>
                <PixelTh className="pt-4">Date</PixelTh>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-teal-900/5">
              {list.map((p) => {
                const b = paymentBalance(p);
                const statusLabel =
                  b.outstanding <= 0 && b.paid > 0
                    ? "PAID"
                    : b.paid > 0 && b.outstanding > 0
                      ? "PARTIAL"
                      : p.status;
                return (
                  <tr key={p.id}>
                    <PixelTd>
                      {p.student
                        ? `${p.student.firstName} ${p.student.lastName}`
                        : p.studentId}
                    </PixelTd>
                    <PixelTd>{p.student?.room?.number ?? "—"}</PixelTd>
                    <PixelTd>{cedis(b.due)}</PixelTd>
                    <PixelTd>{cedis(b.paid)}</PixelTd>
                    <PixelTd>
                      <PixelBadge
                        tone={
                          statusLabel === "PAID" || statusLabel === "COMPLETED"
                            ? "green"
                            : statusLabel === "PARTIAL"
                              ? "amber"
                              : "slate"
                        }
                      >
                        {statusLabel}
                      </PixelBadge>
                    </PixelTd>
                    <PixelTd className="text-[10px]">
                      {p.reference || p.momoTransactionId || "—"}
                    </PixelTd>
                    <PixelTd className="text-[10px]">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString()
                        : p.dueDate
                          ? `Due ${new Date(p.dueDate).toLocaleDateString()}`
                          : "—"}
                    </PixelTd>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PixelCard>

      <RecordPaymentDialog
        open={open}
        students={students ?? []}
        onClose={() => setOpen(false)}
        onDone={() => {
          reload();
          setOpen(false);
        }}
      />
    </div>
  );
}

function RecordPaymentDialog({
  open,
  students,
  onClose,
  onDone,
}: {
  open: boolean;
  students: StudentDTO[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [amountDue, setDue] = useState("");
  const [amountPaid, setPaid] = useState("");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [reference, setRef] = useState("");
  const [momoTransactionId, setMomo] = useState("");
  const [receiptUrl, setReceipt] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [saving, setSaving] = useState(false);

  const student = students.find((s) => s.id === studentId);

  const onPickStudent = (id: string) => {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s?.weeklyAmount != null) {
      const w = String(s.weeklyAmount);
      setDue(w);
      if (!amountPaid) setPaid(w);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/v1/payments", {
        studentId,
        amountDue: Number(amountDue) || 0,
        amountPaid: Number(amountPaid) || 0,
        amount: Number(amountPaid) || 0,
        method,
        reference: reference || undefined,
        momoTransactionId: momoTransactionId || undefined,
        receiptUrl: receiptUrl || undefined,
        paidAt: paidAt || undefined,
      });
      toast.success("Payment recorded.");
      onDone();
      setStudentId("");
      setDue("");
      setPaid("");
      setRef("");
      setMomo("");
      setReceipt("");
      setPaidAt("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Record payment</DialogTitle>
          <DialogDescription>
            Manual entry with due / paid amounts, MoMo ID, and confirmation screenshot URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="stu">Student</PixelLabel>
            <PixelSelect id="stu" value={studentId} onChange={(e) => onPickStudent(e.target.value)} required>
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} · {s.studentId}
                  {s.room?.number ? ` · Rm ${s.room.number}` : ""}
                </option>
              ))}
            </PixelSelect>
            {student?.room && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                Room {student.room.number}
                {student.room.hall?.code ? ` · ${student.room.hall.code}` : ""}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="due">Amount due (GHS)</PixelLabel>
              <PixelInput id="due" type="number" step="0.01" value={amountDue} onChange={(e) => setDue(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="paid">Amount paid (GHS)</PixelLabel>
              <PixelInput id="paid" type="number" step="0.01" value={amountPaid} onChange={(e) => setPaid(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="method">Method</PixelLabel>
              <PixelSelect id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </PixelSelect>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="paidAt">Date paid</PixelLabel>
              <PixelInput id="paidAt" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ref">Transaction reference</PixelLabel>
              <PixelInput id="ref" value={reference} onChange={(e) => setRef(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="momo">MoMo transaction ID</PixelLabel>
              <PixelInput id="momo" value={momoTransactionId} onChange={(e) => setMomo(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <PixelLabel htmlFor="shot">Screenshot / receipt URL</PixelLabel>
              <PixelInput
                id="shot"
                type="url"
                placeholder="https://…"
                value={receiptUrl}
                onChange={(e) => setReceipt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save payment"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
