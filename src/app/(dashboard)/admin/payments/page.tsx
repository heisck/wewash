"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  Clock,
  ImageIcon,
  MessageSquare,
  XCircle,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
  PixelSelect,
  PixelTd,
  PixelTh,
  SectionTitle,
  StatTile,
} from "@/components/pixel/pixel-ui";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { LocationFilterBar } from "@/components/admin/location-filter-bar";
import { useAdminLocationFilter } from "@/hooks/use-admin-location-filter";
import { matchStudentLocation } from "@/lib/admin/location-filter";
import { api, useApi, ApiError } from "@/lib/api/client";
import type {
  HallDTO,
  PaymentDTO,
  PaymentReviewBoard,
  StudentDTO,
  StudentGroupDTO,
} from "@/lib/types/client";

const cedis = (n: string | number) => {
  const v = typeof n === "string" ? Number(n) : n;
  return `₵${(Number.isFinite(v) ? v : 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
};

export default function AdminPaymentsPage() {
  const { data: board, reload, loading } = useApi<PaymentReviewBoard>(
    "/api/v1/payments/review-board"
  );
  const { data: students } = useApi<StudentDTO[]>("/api/v1/students?limit=200");
  const { data: halls } = useApi<HallDTO[]>("/api/v1/halls?limit=100");
  const { data: groups } = useApi<StudentGroupDTO[]>(
    "/api/v1/student-groups?limit=200"
  );
  const { filter } = useAdminLocationFilter();

  const [recordOpen, setRecordOpen] = usePersistedState("admin/payments:recordOpen", false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  /** Only set when admin explicitly clicks Open / picks from search — not from proof cards. */
  const [focusStudentId, setFocusStudentId] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState("");

  // Deep-link from Students roster: /admin/payments?student=<id>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = new URLSearchParams(window.location.search).get("student");
    if (sid) setFocusStudentId(sid);
  }, []);

  const studentsById = useMemo(() => {
    const map = new Map<string, StudentDTO>();
    for (const s of students ?? []) map.set(s.id, s);
    return map;
  }, [students]);

  const pending = board?.pendingProofs ?? [];
  const unpaidAll = board?.unpaidThisWeek ?? [];

  const unpaid = useMemo(
    () => unpaidAll.filter((s) => matchStudentLocation(s, filter)),
    [unpaidAll, filter]
  );

  const filteredPending = useMemo(() => {
    return pending.filter((p) => {
      const st =
        studentsById.get(p.studentId) ??
        (p.student as StudentDTO | undefined) ??
        null;
      return matchStudentLocation(st, filter);
    });
  }, [pending, filter, studentsById]);

  const review = pending.find((p) => p.id === reviewId) ?? null;
  const focusStudent =
    (students ?? []).find((s) => s.id === focusStudentId) ??
    null;
  const focusPending = pending.filter((p) => p.studentId === focusStudentId);

  const sortedPending = useMemo(() => {
    return [...filteredPending].sort((a, b) => {
      const ra = a.student?.room?.number ?? "";
      const rb = b.student?.room?.number ?? "";
      const t = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (t !== 0) return t;
      return String(ra).localeCompare(String(rb), undefined, { numeric: true });
    });
  }, [filteredPending]);

  /** Unpaid grouped by student group for hierarchical browse */
  const unpaidByGroup = useMemo(() => {
    type Bucket = {
      key: string;
      title: string;
      subtitle: string;
      rows: typeof unpaid;
    };
    const map = new Map<string, Bucket>();
    for (const s of unpaid) {
      const gid = s.groupId ?? s.group?.id ?? "__ungrouped__";
      if (!map.has(gid)) {
        map.set(gid, {
          key: gid,
          title:
            gid === "__ungrouped__"
              ? "Ungrouped"
              : s.group?.name ?? "Other group",
          subtitle:
            gid === "__ungrouped__"
              ? "No group assigned"
              : s.group
                ? `${s.group.hall?.code ?? "Hall"} · Fl. ${s.group.floor} · Bl. ${s.group.block}`
                : "",
          rows: [],
        });
      }
      map.get(gid)!.rows.push(s);
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [unpaid]);

  const filteredStudents = useMemo(
    () => (students ?? []).filter((s) => matchStudentLocation(s, filter)),
    [students, filter]
  );

  const studentHits = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const pool = filteredStudents;
    if (!q) return pool.slice(0, 8);
    return pool
      .filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.room?.number ?? s.roomNumber ?? "").toLowerCase().includes(q) ||
          (s.group?.name ?? "").toLowerCase().includes(q) ||
          s.phone.includes(q)
      )
      .slice(0, 12);
  }, [filteredStudents, studentQuery]);

  const confirm = async (p: PaymentDTO) => {
    try {
      await api.patch(`/api/v1/payments/${p.id}`, {
        status: "COMPLETED",
        amountPaid: Number(p.amountPaid ?? p.amount),
      });
      toast.success(
        `Confirmed ${cedis(p.amountPaid ?? p.amount)} for ${p.student?.firstName ?? "student"}.`
      );
      setReviewId(null);
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || "Confirm failed");
    }
  };

  const reject = async (p: PaymentDTO) => {
    try {
      await api.patch(`/api/v1/payments/${p.id}`, { status: "FAILED" });
      toast.message("Marked not verified — student was notified.");
      setReviewId(null);
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || "Update failed");
    }
  };

  const remind = async (studentId: string, firstName: string, remaining: number) => {
    try {
      await api.post("/api/v1/notifications", {
        target: "selected",
        studentIds: [studentId],
        title: "WeWash payment reminder",
        body: `Hi ${firstName}, please complete this week's WeWash dues. GHS ${remaining} still remaining — pay off-app and upload proof. - WeWash`,
        channels: ["SMS", "PUSH"],
      });
      toast.success(`Reminder sent to ${firstName}.`);
    } catch (err) {
      toast.error((err as ApiError).message || "Could not send reminder");
    }
  };

  const openStudent = (id: string) => {
    setFocusStudentId(id);
  };

  const closeStudent = () => {
    setFocusStudentId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="PAYMENTS"
          sub="Filter by hostel/group · approve proofs · open a student"
        />
        <PixelButton variant="outline" onClick={() => setRecordOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Manual record
        </PixelButton>
      </div>

      <LocationFilterBar halls={halls} groups={groups} />

      {/* Find student → open their panel */}
      <PixelCard className="p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">
          Find student
        </p>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-teal-900/40" />
          <PixelInput
            className="pl-9"
            placeholder="Name, ID, room, phone…"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
          />
        </div>
        {studentQuery.trim() && (
          <ul className="mt-2 max-h-48 divide-y-2 divide-teal-900/5 overflow-y-auto border-2 border-teal-900/10">
            {studentHits.length === 0 ? (
              <li className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
                No match
              </li>
            ) : (
              studentHits.map((s) => {
                const hasPending = pending.some((p) => p.studentId === s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        openStudent(s.id);
                        setStudentQuery("");
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-teal-600/5"
                    >
                      <span>
                        <span className="text-xs font-black uppercase text-teal-950 dark:text-white">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="mt-0.5 block text-[9px] font-bold text-teal-900/45">
                          {s.studentId}
                          {s.room?.number || s.roomNumber
                            ? ` · Rm ${s.room?.number ?? s.roomNumber}`
                            : ""}
                        </span>
                      </span>
                      {hasPending ? (
                        <PixelBadge tone="amber">APPROVE</PixelBadge>
                      ) : (
                        <PixelBadge tone="slate">OPEN</PixelBadge>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </PixelCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Awaiting your check"
          value={String(sortedPending.length)}
          sub={
            filter.hallId || filter.groupId || filter.floor || filter.block
              ? "In this location filter"
              : "Student proofs to verify"
          }
          icon={<Clock />}
        />
        <StatTile
          label="Not paid in full"
          value={String(unpaid.length)}
          sub={
            filter.hallId || filter.groupId || filter.floor || filter.block
              ? "In this location filter"
              : "Confirmed total still under weekly fee"
          }
          icon={<Banknote />}
        />
        <StatTile
          label="Paid in full"
          value={String(board?.counts.paid ?? 0)}
          sub="All hostels (unfiltered total)"
          icon={<CheckCircle2 />}
        />
      </div>

      {/* ── Verify queue ── */}
      <div className="space-y-3">
        <SectionTitle text="VERIFY PAYMENT PROOFS" />
        <p className="text-xs text-teal-900/55 dark:text-teal-100/55">
          Tap a card to see the screenshot and approve, or open a student to approve / record.
        </p>
        {loading && !board ? (
          <PixelCard className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
            Loading queue…
          </PixelCard>
        ) : sortedPending.length === 0 ? (
          <PixelCard className="flex items-center justify-center gap-2 py-12 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
            <CheckCircle2 className="h-4 w-4" /> No proofs waiting — queue clear.
          </PixelCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedPending.map((p) => {
              const claimed = Number(p.amountPaid ?? p.amount ?? 0);
              const expected = Number(p.amountDue ?? p.student?.weeklyAmount ?? claimed);
              const room =
                p.student?.room?.number ??
                (p.student as { roomNumber?: string } | undefined)?.roomNumber ??
                "—";
              const hall = p.student?.room?.hall?.code;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setReviewId(p.id)}
                  className="overflow-hidden border-2 border-teal-900/20 bg-white text-left shadow-pixel-sm transition hover:border-teal-600 dark:border-teal-100/15 dark:bg-teal-950/40"
                >
                  <div className="relative aspect-[4/3] w-full border-b-2 border-teal-900/10 bg-teal-950/5 dark:border-teal-100/10">
                    {p.receiptUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.receiptUrl}
                        alt={`Payment proof from ${p.student?.firstName ?? "student"}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-teal-900/40">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          No screenshot
                        </span>
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <PixelBadge tone="amber">CHECK</PixelBadge>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-900/40">
                      Room {room}
                      {hall ? ` · ${hall}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-black uppercase tracking-wide text-teal-950 dark:text-white">
                      {p.student
                        ? `${p.student.firstName} ${p.student.lastName}`
                        : p.studentId}
                    </p>
                    <p className="mt-3 text-3xl font-black tabular-nums text-teal-700 dark:text-teal-300">
                      {cedis(claimed)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-teal-900/50">
                      Weekly fee: {cedis(expected)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Not paid in full — by group ── */}
      <div className="space-y-4">
        <SectionTitle text="NOT PAID IN FULL (BY GROUP)" />
        {unpaid.length === 0 ? (
          <PixelCard className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
            Everyone with a weekly fee is paid in full this week
            {filter.hallId || filter.groupId || filter.floor || filter.block
              ? " (in this filter)."
              : "."}
          </PixelCard>
        ) : (
          unpaidByGroup.map((bucket) => (
            <div key={bucket.key} className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-teal-900/15 pb-2 dark:border-teal-100/15">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
                    {bucket.title}
                  </h3>
                  {bucket.subtitle && (
                    <p className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                      {bucket.subtitle}
                    </p>
                  )}
                </div>
                <PixelBadge tone="amber">
                  {bucket.rows.length} unpaid
                </PixelBadge>
              </div>
              <PixelCard className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-b-2 border-teal-900/15">
                      <PixelTh className="pt-4">Room</PixelTh>
                      <PixelTh className="pt-4">Student</PixelTh>
                      <PixelTh className="pt-4">Weekly fee</PixelTh>
                      <PixelTh className="pt-4">Paid</PixelTh>
                      <PixelTh className="pt-4">Remaining</PixelTh>
                      <PixelTh className="pt-4">Actions</PixelTh>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-teal-900/5">
                    {bucket.rows.map((s) => (
                      <tr key={s.id}>
                        <PixelTd className="font-black">
                          {s.room?.number ?? s.roomNumber ?? "—"}
                        </PixelTd>
                        <PixelTd>
                          {s.firstName} {s.lastName}
                          <span className="mt-0.5 block text-[9px] text-teal-900/40">
                            {s.studentId}
                          </span>
                        </PixelTd>
                        <PixelTd className="font-black tabular-nums">
                          {cedis(s.weeklyAmount)}
                        </PixelTd>
                        <PixelTd className="tabular-nums">
                          {cedis(s.paidThisWeek ?? 0)}
                        </PixelTd>
                        <PixelTd className="font-black tabular-nums text-amber-600">
                          {cedis(s.remaining ?? s.weeklyAmount)}
                        </PixelTd>
                        <PixelTd>
                          <div className="flex flex-wrap gap-1">
                            <PixelButton
                              size="sm"
                              type="button"
                              onClick={() => openStudent(s.id)}
                            >
                              <UserRound className="h-3 w-3" /> Open
                            </PixelButton>
                            <PixelButton
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() =>
                                remind(
                                  s.id,
                                  s.firstName,
                                  s.remaining ?? s.weeklyAmount
                                )
                              }
                            >
                              <MessageSquare className="h-3 w-3" /> Remind
                            </PixelButton>
                          </div>
                        </PixelTd>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PixelCard>
            </div>
          ))
        )}
      </div>

      <ReviewDialog
        payment={review}
        onClose={() => setReviewId(null)}
        onConfirm={() => review && confirm(review)}
        onReject={() => review && reject(review)}
      />

      <StudentFocusDialog
        student={focusStudent}
        pending={focusPending}
        onClose={closeStudent}
        onApprove={(p) => confirm(p)}
        onReject={(p) => reject(p)}
        onReviewImage={(p) => setReviewId(p.id)}
        onRecorded={() => {
          reload();
        }}
      />

      <RecordPaymentDialog
        open={recordOpen}
        students={filteredStudents}
        presetStudentId={null}
        onClose={() => setRecordOpen(false)}
        onDone={() => {
          reload();
          setRecordOpen(false);
        }}
      />
    </div>
  );
}

/** Per-student panel: approve pending proofs or manual record. */
function StudentFocusDialog({
  student,
  pending,
  onClose,
  onApprove,
  onReject,
  onReviewImage,
  onRecorded,
}: {
  student: StudentDTO | null;
  pending: PaymentDTO[];
  onClose: () => void;
  onApprove: (p: PaymentDTO) => void;
  onReject: (p: PaymentDTO) => void;
  onReviewImage: (p: PaymentDTO) => void;
  onRecorded: () => void;
}) {
  const [recordOpen, setRecordOpen] = useState(false);

  useEffect(() => {
    setRecordOpen(false);
  }, [student?.id]);

  if (!student) return null;

  const weekly = Number(student.weeklyAmount ?? 0);
  const roomLabel = student.room?.number ?? student.roomNumber ?? "—";

  return (
    <>
      <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">
              {student.firstName} {student.lastName}
            </DialogTitle>
            <DialogDescription>
              {student.studentId} · Room {roomLabel}
              {student.phone ? ` · ${student.phone}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="border-2 border-teal-900/15 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                  Weekly fee
                </p>
                <p className="text-xl font-black tabular-nums">{cedis(weekly)}</p>
              </div>
              <div className="border-2 border-teal-900/15 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                  Pending proofs
                </p>
                <p className="text-xl font-black tabular-nums">{pending.length}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-900/50">
                Approve payment
              </p>
              {pending.length === 0 ? (
                <p className="border-2 border-dashed border-teal-900/15 px-3 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-teal-900/40">
                  No proof waiting — use manual record if they paid you directly
                </p>
              ) : (
                pending.map((p) => {
                  const claimed = Number(p.amountPaid ?? p.amount ?? 0);
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 border-2 border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center"
                    >
                      {p.receiptUrl ? (
                        <button type="button" onClick={() => onReviewImage(p)} className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.receiptUrl}
                            alt="Proof"
                            className="h-16 w-16 border-2 border-teal-900/15 object-cover"
                          />
                        </button>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-black tabular-nums text-teal-800 dark:text-teal-200">
                          {cedis(claimed)}
                        </p>
                        <p className="text-[9px] text-teal-900/45">
                          {new Date(p.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <PixelButton size="sm" type="button" onClick={() => onApprove(p)}>
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => onReject(p)}
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </PixelButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <PixelButton
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setRecordOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Manual record payment
            </PixelButton>
          </div>

          <DialogFooter>
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Close
            </PixelButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        open={recordOpen}
        students={[student]}
        presetStudentId={student.id}
        onClose={() => setRecordOpen(false)}
        onDone={() => {
          setRecordOpen(false);
          onRecorded();
        }}
      />
    </>
  );
}

function ReviewDialog({
  payment,
  onClose,
  onConfirm,
  onReject,
}: {
  payment: PaymentDTO | null;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
}) {
  if (!payment) return null;
  const claimed = Number(payment.amountPaid ?? payment.amount ?? 0);
  const expected = Number(
    payment.amountDue ??
      (payment.student as { weeklyAmount?: string | number } | undefined)?.weeklyAmount ??
      claimed
  );
  const room = payment.student?.room?.number ?? "—";
  const hall = payment.student?.room?.hall?.code;

  return (
    <Dialog open={!!payment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">
            Verify payment
          </DialogTitle>
          <DialogDescription>
            Match the amount on your phone with the screenshot, then approve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {payment.receiptUrl ? (
            <div className="overflow-hidden border-2 border-teal-900/20 bg-black/5 dark:bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.receiptUrl}
                alt="Payment screenshot uploaded by student"
                className="mx-auto max-h-[min(60vh,520px)] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-500/40 py-16 text-amber-600">
              <ImageIcon className="h-10 w-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                No screenshot uploaded
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-2 border-teal-900/15 bg-teal-600/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                Student
              </p>
              <p className="mt-1 text-sm font-black uppercase text-teal-950 dark:text-white">
                {payment.student
                  ? `${payment.student.firstName} ${payment.student.lastName}`
                  : payment.studentId}
              </p>
              <p className="text-[10px] font-bold text-teal-900/50">
                Room {room}
                {hall ? ` · ${hall}` : ""}
              </p>
            </div>
            <div className="border-2 border-teal-600/40 bg-teal-600/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/50">
                Claims paid
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-teal-800 dark:text-teal-200">
                {cedis(claimed)}
              </p>
            </div>
            <div className="border-2 border-teal-900/15 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                Weekly fee
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums">{cedis(expected)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <PixelButton type="button" variant="outline" onClick={onClose}>
            Later
          </PixelButton>
          <PixelButton type="button" variant="outline" onClick={onReject}>
            <XCircle className="h-3.5 w-3.5" /> Reject
          </PixelButton>
          <PixelButton type="button" onClick={onConfirm}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve {cedis(claimed)}
          </PixelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentDialog({
  open,
  students,
  presetStudentId,
  onClose,
  onDone,
}: {
  open: boolean;
  students: StudentDTO[];
  presetStudentId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [studentId, setStudentId] = useState(presetStudentId ?? "");
  const [amountPaid, setPaid] = useState("");
  const [method, setMethod] = useState("CASH");
  const [reference, setRef] = useState("");
  const [momoTransactionId, setMomo] = useState("");
  const [saving, setSaving] = useState(false);

  const student = students.find((s) => s.id === studentId);
  const amountDue =
    student?.weeklyAmount != null ? String(Number(student.weeklyAmount)) : "";

  useEffect(() => {
    if (!open) return;
    const id = presetStudentId ?? "";
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s?.weeklyAmount != null) setPaid(String(Number(s.weeklyAmount)));
    else setPaid("");
    setRef("");
    setMomo("");
    setMethod("CASH");
  }, [open, presetStudentId, students]);

  const onPickStudent = (id: string) => {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s?.weeklyAmount != null) setPaid(String(Number(s.weeklyAmount)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Select a student.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/v1/payments", {
        studentId,
        amountDue: Number(amountDue) || 0,
        amountPaid: Number(amountPaid) || 0,
        amount: Number(amountPaid) || 0,
        method,
        reference: reference.trim() || undefined,
        momoTransactionId: momoTransactionId.trim() || undefined,
        status: "COMPLETED",
      });
      toast.success("Payment recorded.");
      onDone();
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
          <DialogTitle className="font-black uppercase tracking-wider">
            Manual record
          </DialogTitle>
          <DialogDescription>
            Cash or confirmed off-app payment you verified yourself. Due is the weekly fee (read-only).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="stu">Student</PixelLabel>
            <PixelSelect
              id="stu"
              value={studentId}
              onChange={(e) => onPickStudent(e.target.value)}
              required
              disabled={!!presetStudentId}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} · {s.studentId}
                  {s.room?.number ? ` · Rm ${s.room.number}` : ""}
                </option>
              ))}
            </PixelSelect>
            {student && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                Room {student.room?.number ?? student.roomNumber ?? "—"}
                {student.phone ? ` · ${student.phone}` : ""}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="due">Amount due (GHS)</PixelLabel>
              <PixelInput
                id="due"
                type="number"
                step="0.01"
                value={amountDue}
                readOnly
                disabled
                className="opacity-80"
              />
              <p className="text-[8px] font-bold uppercase tracking-widest text-teal-900/35">
                From student weekly fee
              </p>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="paid">Amount paid (GHS)</PixelLabel>
              <PixelInput
                id="paid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setPaid(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="method">Method</PixelLabel>
              <PixelSelect id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="OTHER">Other</option>
              </PixelSelect>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ref">Reference (optional)</PixelLabel>
              <PixelInput
                id="ref"
                value={reference}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="momo">Transaction ID (optional)</PixelLabel>
              <PixelInput
                id="momo"
                value={momoTransactionId}
                onChange={(e) => setMomo(e.target.value)}
                placeholder="Optional MoMo / bank txn id"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving || !studentId}>
              {saving ? "Saving..." : "Save payment"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
