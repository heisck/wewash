"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, CreditCard, Send, Search, Trash2, Megaphone } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel,
  PixelSelect, PixelTextarea, PixelTd, PixelTh,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { StudentDTO, HallDTO, RoomDTO } from "@/lib/types/client";

export default function AdminStudents() {
  const { data: students, reload } = useApi<StudentDTO[]>("/api/v1/students?limit=100");
  const { data: halls } = useApi<HallDTO[]>("/api/v1/halls?limit=100");

  const [searchTerm, setSearchTerm] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [payFor, setPayFor] = useState<StudentDTO | null>(null);

  const list = students ?? [];
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return list.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.room?.number ?? "").toLowerCase().includes(q)
    );
  }, [list, searchTerm]);

  const sendReminder = async (s: StudentDTO) => {
    try {
      await api.post("/api/v1/notifications", {
        target: "selected",
        studentIds: [s.id],
        title: "Payment reminder",
        body: `Hi ${s.firstName}, a friendly reminder about your WeWash weekly dues. Thank you!`,
      });
      toast.success(`Reminder sent to ${s.firstName}.`);
    } catch (e) {
      toast.error((e as ApiError).message || "Could not send reminder.");
    }
  };

  const removeStudent = async (s: StudentDTO) => {
    if (!confirm(`Remove ${s.firstName} ${s.lastName} from the program?`)) return;
    try {
      await api.del(`/api/v1/students/${s.id}`);
      toast.success(`${s.firstName} removed.`);
      reload();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not remove student.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="STUDENTS" sub="Rosters, dues & notifications" />
        <div className="flex gap-2">
          <PixelButton variant="outline" onClick={() => setBroadcastOpen(true)}>
            <Megaphone className="h-3.5 w-3.5" /> Notify all
          </PixelButton>
          <PixelButton onClick={() => setRegisterOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Register student
          </PixelButton>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-900/40 dark:text-teal-100/40" />
        <PixelInput
          placeholder="Search by name, room, or ID..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Roster */}
      <PixelCard className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
              <PixelTh className="pt-4">Student</PixelTh>
              <PixelTh className="pt-4">Student ID</PixelTh>
              <PixelTh className="pt-4">Room</PixelTh>
              <PixelTh className="pt-4">Phone</PixelTh>
              <PixelTh className="pt-4">Status</PixelTh>
              <PixelTh className="pt-4 text-right">Actions</PixelTh>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5">
                  <PixelTd className="font-black">{s.firstName} {s.lastName}</PixelTd>
                  <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">{s.studentId}</PixelTd>
                  <PixelTd className="font-black text-teal-700 dark:text-teal-300">
                    {s.room ? `${s.room.number}${s.room.hall ? ` · ${s.room.hall.code}` : ""}` : "—"}
                  </PixelTd>
                  <PixelTd className="font-mono text-[10px] text-teal-900/60 dark:text-teal-100/60">{s.phone}</PixelTd>
                  <PixelTd>
                    <PixelBadge tone={s.isActive ? "green" : "slate"}>{s.isActive ? "ACTIVE" : "INACTIVE"}</PixelBadge>
                  </PixelTd>
                  <PixelTd className="text-right">
                    <div className="flex justify-end gap-2">
                      <PixelButton size="sm" variant="outline" onClick={() => setPayFor(s)}>
                        <CreditCard className="h-3 w-3" /> Pay
                      </PixelButton>
                      <PixelButton size="sm" variant="ghost" aria-label={`Send reminder to ${s.firstName}`} onClick={() => sendReminder(s)}>
                        <Send className="h-3.5 w-3.5" />
                      </PixelButton>
                      <PixelButton size="sm" variant="ghost" aria-label={`Remove ${s.firstName}`} onClick={() => removeStudent(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </PixelButton>
                    </div>
                  </PixelTd>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
                  {list.length === 0 ? "No students yet — register your first." : "No matching students."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </PixelCard>

      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} halls={halls ?? []} onDone={reload} />
      <PaymentDialog student={payFor} onClose={() => setPayFor(null)} onDone={reload} />
      <BroadcastDialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
    </div>
  );
}

/* ─── Register student ─── */
function RegisterDialog({ open, onClose, halls, onDone }: { open: boolean; onClose: () => void; halls: HallDTO[]; onDone: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [hallId, setHallId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: rooms } = useApi<RoomDTO[]>(hallId ? `/api/v1/halls/${hallId}/rooms` : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/v1/students", {
        firstName,
        lastName,
        studentId,
        phone,
        roomId: roomId || undefined,
      });
      toast.success(`${firstName} registered. A welcome SMS is on its way.`);
      onDone();
      onClose();
      setFirstName(""); setLastName(""); setStudentId(""); setPhone(""); setHallId(""); setRoomId("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not register student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Register student</DialogTitle>
          <DialogDescription>Add a student to the program and assign their room.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="fn">First name</PixelLabel>
              <PixelInput id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ln">Last name</PixelLabel>
              <PixelInput id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="sid">Student ID</PixelLabel>
              <PixelInput id="sid" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph">Phone</PixelLabel>
              <PixelInput id="ph" placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="hall">Hostel</PixelLabel>
              <PixelSelect id="hall" value={hallId} onChange={(e) => { setHallId(e.target.value); setRoomId(""); }}>
                <option value="">Select hall</option>
                {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </PixelSelect>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="room">Room</PixelLabel>
              <PixelSelect id="room" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!hallId}>
                <option value="">Select room</option>
                {(rooms ?? []).map((r) => <option key={r.id} value={r.id}>Room {r.number}</option>)}
              </PixelSelect>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>Cancel</PixelButton>
            <PixelButton type="submit" disabled={saving}>{saving ? "Saving..." : "Register"}</PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Record payment ─── */
function PaymentDialog({ student, onClose, onDone }: { student: StudentDTO | null; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter a valid amount.");
    setSaving(true);
    try {
      await api.post("/api/v1/payments", {
        studentId: student.id,
        amount: amt,
        method,
        reference: reference || undefined,
      });
      toast.success(`GHS ${amt.toFixed(2)} recorded — ${student.firstName} notified.`);
      onDone();
      onClose();
      setAmount(""); setReference("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={student !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Record payment</DialogTitle>
          <DialogDescription>Payment received from <strong>{student?.firstName} {student?.lastName}</strong>.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="amount">Amount paid (GHS)</PixelLabel>
            <PixelInput id="amount" type="number" step="0.01" placeholder="35.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="method">Method</PixelLabel>
            <PixelSelect id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </PixelSelect>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="ref">Reference (optional)</PixelLabel>
            <PixelInput id="ref" placeholder="e.g. TXN2026070188" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>Cancel</PixelButton>
            <PixelButton type="submit" disabled={saving}>{saving ? "Saving..." : "Record payment"}</PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Broadcast notification ─── */
function BroadcastDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post<{ recipients: number }>("/api/v1/notifications", {
        target: "all",
        title,
        body,
      });
      toast.success(`Sent to ${res.recipients} student(s).`);
      onClose();
      setTitle(""); setBody("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not send broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Notify all students</DialogTitle>
          <DialogDescription>Sends an SMS + push notification to every active student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="nt">Title</PixelLabel>
            <PixelInput id="nt" placeholder="e.g. Rotation update" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="nb">Message</PixelLabel>
            <PixelTextarea id="nb" rows={3} placeholder="Type your announcement..." value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>Cancel</PixelButton>
            <PixelButton type="submit" disabled={sending}>{sending ? "Sending..." : "Send to all"}</PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
