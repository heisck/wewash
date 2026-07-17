"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  CreditCard,
  Send,
  Search,
  Trash2,
  Megaphone,
  ChevronDown,
  ChevronRight,
  UsersRound,
  Plus,
  Loader2,
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
  PixelTextarea,
  PixelTd,
  PixelTh,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type {
  StudentDTO,
  HallDTO,
  StudentGroupDTO,
} from "@/lib/types/client";

type Tab = "roster" | "groups";

export default function AdminStudents() {
  const { data: students, reload: reloadStudents } = useApi<StudentDTO[]>(
    "/api/v1/students?limit=200"
  );
  const { data: halls } = useApi<HallDTO[]>("/api/v1/halls?limit=100");
  const { data: groups, reload: reloadGroups } = useApi<StudentGroupDTO[]>(
    "/api/v1/student-groups?limit=200"
  );

  const [tab, setTab] = useState<Tab>("roster");
  const [searchTerm, setSearchTerm] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [payFor, setPayFor] = useState<StudentDTO | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Student id while SMS reminder is in flight */
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const list = students ?? [];
  const groupList = groups ?? [];

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return list.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.roomNumber ?? s.room?.number ?? "").toLowerCase().includes(q) ||
        (s.group?.name ?? "").toLowerCase().includes(q) ||
        (s.group?.floor ?? "").toLowerCase().includes(q) ||
        (s.group?.block ?? "").toLowerCase().includes(q)
    );
  }, [list, searchTerm]);

  const reloadAll = () => {
    reloadStudents();
    reloadGroups();
  };

  const sendReminder = async (s: StudentDTO) => {
    if (remindingId) return;
    if (!s.phone?.trim()) {
      toast.error(`No phone number for ${s.firstName} — cannot send SMS.`);
      return;
    }
    setRemindingId(s.id);
    const toastId = toast.loading(`Sending SMS to ${s.firstName}…`);
    try {
      const result = await api.post<{
        sms?: number;
        push?: number;
        recipients?: number;
      }>("/api/v1/notifications", {
        target: "selected",
        studentIds: [s.id],
        title: "Payment reminder",
        body: `Hi ${s.firstName}, a friendly reminder about your WeWash weekly dues. Thank you!`,
        channels: ["SMS"],
      });
      if ((result?.sms ?? 0) > 0) {
        toast.success(`SMS sent to ${s.firstName} (${s.phone}).`, {
          id: toastId,
        });
      } else {
        toast.warning(
          `Request finished but no SMS was delivered to ${s.firstName}. Check phone / Arkesel sandbox.`,
          { id: toastId }
        );
      }
    } catch (e) {
      toast.error(
        (e as ApiError).message || `Could not send SMS to ${s.firstName}.`,
        { id: toastId }
      );
    } finally {
      setRemindingId(null);
    }
  };

  const removeStudent = async (s: StudentDTO) => {
    if (!confirm(`Remove ${s.firstName} ${s.lastName} from the program?`)) return;
    try {
      await api.del(`/api/v1/students/${s.id}`);
      toast.success(`${s.firstName} removed.`);
      reloadAll();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not remove student.");
    }
  };

  const removeGroup = async (g: StudentGroupDTO) => {
    if (
      !confirm(
        `Delete group “${g.name}”? Students stay in the system but leave this group.`
      )
    )
      return;
    try {
      await api.del(`/api/v1/student-groups/${g.id}`);
      toast.success("Group removed.");
      reloadAll();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not remove group.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="STUDENTS" sub="Groups, rosters, dues & notifications" />
        <div className="flex flex-wrap gap-2">
          <PixelButton variant="outline" onClick={() => setBroadcastOpen(true)}>
            <Megaphone className="h-3.5 w-3.5" /> Notify all
          </PixelButton>
          <PixelButton variant="outline" onClick={() => setGroupOpen(true)}>
            <UsersRound className="h-3.5 w-3.5" /> New group
          </PixelButton>
          {groupList.length > 0 && (
            <PixelButton onClick={() => setRegisterOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" /> Register student
            </PixelButton>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("roster")}
          className={`border-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest ${
            tab === "roster"
              ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
              : "border-teal-900/20 text-teal-900/50 dark:border-teal-100/20 dark:text-teal-100/50"
          }`}
        >
          Roster
        </button>
        <button
          type="button"
          onClick={() => setTab("groups")}
          className={`border-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest ${
            tab === "groups"
              ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
              : "border-teal-900/20 text-teal-900/50 dark:border-teal-100/20 dark:text-teal-100/50"
          }`}
        >
          Groups ({groupList.length})
        </button>
      </div>

      {tab === "roster" ? (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-900/40 dark:text-teal-100/40" />
            <PixelInput
              placeholder="Search name, room, group, floor..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <PixelCard className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
                  <PixelTh className="w-8 pt-4" />
                  <PixelTh className="pt-4">Student</PixelTh>
                  <PixelTh className="pt-4">ID</PixelTh>
                  <PixelTh className="pt-4">Room</PixelTh>
                  <PixelTh className="pt-4">Group / floor</PixelTh>
                  <PixelTh className="pt-4">Status</PixelTh>
                  <PixelTh className="pt-4 text-right">Actions</PixelTh>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
                {filtered.length > 0 ? (
                  filtered.map((s) => {
                    const open = expandedId === s.id;
                    const roomLabel =
                      s.roomNumber || s.room?.number || "—";
                    const groupLabel = s.group
                      ? `${s.group.name} · Fl. ${s.group.floor} · Bl. ${s.group.block}`
                      : "—";
                    return (
                      <StudentRows
                        key={s.id}
                        student={s}
                        open={open}
                        roomLabel={roomLabel}
                        groupLabel={groupLabel}
                        onToggle={() =>
                          setExpandedId(open ? null : s.id)
                        }
                        onPay={() => setPayFor(s)}
                        onRemind={() => void sendReminder(s)}
                        onRemove={() => void removeStudent(s)}
                        reminding={remindingId === s.id}
                        remindDisabled={!!remindingId}
                      />
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40"
                    >
                      {list.length === 0
                        ? "No students yet — create a group, then register."
                        : "No matching students."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </PixelCard>
        </>
      ) : (
        <div className="space-y-4">
          <p className="max-w-xl text-[11px] font-semibold text-teal-900/55 dark:text-teal-100/55">
            Create a group for a hostel floor and block first. Then register
            students into that group and type their room number.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupList.map((g) => (
              <PixelCard key={g.id} bolts className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-teal-950 dark:text-teal-50">
                      {g.name}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                      {g.hall?.name ?? "Hostel"} · Floor {g.floor} · Block{" "}
                      {g.block}
                    </p>
                  </div>
                  <PixelBadge tone={g.isActive ? "green" : "slate"}>
                    {g._count?.students ?? 0} students
                  </PixelBadge>
                </div>
                {g.notes && (
                  <p className="mt-2 text-[10px] text-teal-900/60 dark:text-teal-100/60">
                    {g.notes}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <PixelButton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTab("roster");
                      setSearchTerm(g.name);
                    }}
                  >
                    View roster
                  </PixelButton>
                  <PixelButton
                    size="sm"
                    variant="ghost"
                    onClick={() => void removeGroup(g)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </PixelButton>
                </div>
              </PixelCard>
            ))}
            {groupList.length === 0 && (
              <PixelCard className="col-span-full p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
                  No groups yet
                </p>
                <PixelButton
                  className="mt-4"
                  onClick={() => setGroupOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Create first group
                </PixelButton>
              </PixelCard>
            )}
          </div>
        </div>
      )}

      <RegisterDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        groups={groupList}
        onDone={reloadAll}
      />
      <CreateGroupDialog
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        halls={halls ?? []}
        onDone={reloadAll}
      />
      <PaymentDialog
        student={payFor}
        onClose={() => setPayFor(null)}
        onDone={reloadAll}
      />
      <BroadcastDialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
      />
    </div>
  );
}

function StudentRows({
  student: s,
  open,
  roomLabel,
  groupLabel,
  onToggle,
  onPay,
  onRemind,
  onRemove,
  reminding,
  remindDisabled,
}: {
  student: StudentDTO;
  open: boolean;
  roomLabel: string;
  groupLabel: string;
  onToggle: () => void;
  onPay: () => void;
  onRemind: () => void;
  onRemove: () => void;
  reminding: boolean;
  remindDisabled: boolean;
}) {
  return (
    <>
      <tr className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5">
        <PixelTd>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 items-center justify-center border-2 border-teal-900/15 text-teal-900 dark:border-teal-100/20 dark:text-teal-100"
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand details"}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </PixelTd>
        <PixelTd className="font-black">
          {s.firstName} {s.lastName}
        </PixelTd>
        <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
          {s.studentId}
        </PixelTd>
        <PixelTd className="font-black text-teal-700 dark:text-teal-300">
          {roomLabel}
        </PixelTd>
        <PixelTd className="max-w-[200px] truncate text-[10px] font-semibold text-teal-900/60 dark:text-teal-100/60">
          {groupLabel}
        </PixelTd>
        <PixelTd>
          <PixelBadge tone={s.isActive ? "green" : "slate"}>
            {s.isActive ? "ACTIVE" : "INACTIVE"}
          </PixelBadge>
        </PixelTd>
        <PixelTd className="text-right">
          <div className="flex justify-end gap-2">
            <PixelButton size="sm" variant="outline" onClick={onPay}>
              <CreditCard className="h-3 w-3" /> Pay
            </PixelButton>
            <PixelButton
              size="sm"
              variant="ghost"
              onClick={onRemind}
              disabled={remindDisabled}
              aria-busy={reminding}
              aria-label={
                reminding
                  ? `Sending SMS to ${s.firstName}`
                  : `Send SMS reminder to ${s.firstName}`
              }
              title={reminding ? "Sending SMS…" : "Send SMS reminder"}
            >
              {reminding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </PixelButton>
            <PixelButton size="sm" variant="ghost" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </PixelButton>
          </div>
        </PixelTd>
      </tr>
      {open && (
        <tr className="bg-teal-600/[0.04] dark:bg-teal-400/[0.04]">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailBlock title="Contact">
                <DetailRow label="Phone" value={s.phone} />
                <DetailRow label="Secondary" value={s.secondaryPhone} />
                <DetailRow label="WhatsApp" value={s.whatsapp} />
                <DetailRow label="Email" value={s.email} />
              </DetailBlock>
              <DetailBlock title="Placement">
                <DetailRow label="Room (typed)" value={s.roomNumber || s.room?.number} />
                <DetailRow
                  label="Hostel"
                  value={s.group?.hall?.name || s.room?.hall?.name}
                />
                <DetailRow label="Group" value={s.group?.name} />
                <DetailRow label="Floor" value={s.group?.floor} />
                <DetailRow label="Block" value={s.group?.block} />
              </DetailBlock>
              <DetailBlock title="Program">
                <DetailRow label="Student ID" value={s.studentId} />
                <DetailRow label="Index" value={s.indexNumber} />
                <DetailRow
                  label="Weekly (GHS)"
                  value={
                    s.weeklyAmount != null ? String(s.weeklyAmount) : undefined
                  }
                />
                <DetailRow
                  label="Joined"
                  value={
                    s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString()
                      : undefined
                  }
                />
              </DetailBlock>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-teal-900/10 p-3 dark:border-teal-100/10">
      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-teal-900/45 dark:text-teal-100/45">
        {title}
      </p>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-3 text-[11px]">
      <dt className="font-semibold text-teal-900/45 dark:text-teal-100/45">
        {label}
      </dt>
      <dd className="text-right font-black text-teal-950 dark:text-teal-50">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

/* ─── Create floor/block group ─── */
function CreateGroupDialog({
  open,
  onClose,
  halls,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  halls: HallDTO[];
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [hallId, setHallId] = useState("");
  const [floor, setFloor] = useState("");
  const [block, setBlock] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallId) return toast.error("Select a hostel.");
    setSaving(true);
    try {
      await api.post("/api/v1/student-groups", {
        name: name.trim() || `Block ${block} · Floor ${floor}`,
        hallId,
        floor: floor.trim(),
        block: block.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success("Group created. You can add students to it now.");
      onDone();
      onClose();
      setName("");
      setHallId("");
      setFloor("");
      setBlock("");
      setNotes("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not create group.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">
            New student group
          </DialogTitle>
          <DialogDescription>
            Define a floor + block under a hostel. Then assign students and type
            their room numbers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="g-hall">Hostel</PixelLabel>
            <PixelSelect
              id="g-hall"
              value={hallId}
              onChange={(e) => setHallId(e.target.value)}
              required
            >
              <option value="">Select hostel</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </PixelSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="g-floor">Floor</PixelLabel>
              <PixelInput
                id="g-floor"
                placeholder="e.g. 2 or Ground"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="g-block">Block</PixelLabel>
              <PixelInput
                id="g-block"
                placeholder="e.g. A"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="g-name">Group name (optional)</PixelLabel>
            <PixelInput
              id="g-name"
              placeholder="Auto: Block A · Floor 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="g-notes">Notes</PixelLabel>
            <PixelTextarea
              id="g-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create group"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Register student into a group (typed room) ─── */
function RegisterDialog({
  open,
  onClose,
  groups,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  groups: StudentGroupDTO[];
  onDone: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondary] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [weeklyAmount, setWeekly] = useState("");
  const [temporaryPassword, setTempPw] = useState("");
  const [groupId, setGroupId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedGroup = groups.find((g) => g.id === groupId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return toast.error("Select a student group.");
    if (!roomNumber.trim()) return toast.error("Type the room number.");
    setSaving(true);
    try {
      await api.post("/api/v1/students", {
        firstName,
        lastName,
        studentId,
        indexNumber: indexNumber || undefined,
        email,
        phone,
        secondaryPhone: secondaryPhone || undefined,
        whatsapp: whatsapp || undefined,
        weeklyAmount: weeklyAmount ? Number(weeklyAmount) : undefined,
        temporaryPassword: temporaryPassword || undefined,
        groupId,
        roomNumber: roomNumber.trim(),
      });
      toast.success(`${firstName} registered in ${selectedGroup?.name ?? "group"}.`);
      onDone();
      onClose();
      setFirstName("");
      setLastName("");
      setStudentId("");
      setIndexNumber("");
      setEmail("");
      setPhone("");
      setSecondary("");
      setWhatsapp("");
      setWeekly("");
      setTempPw("");
      setGroupId("");
      setRoomNumber("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not register student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">
            Register student
          </DialogTitle>
          <DialogDescription>
            Pick a group (floor / block), then type the room number. Login is
            created for the email you assign.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          {groups.length === 0 && (
            <p className="border-2 border-amber-600/40 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-900 dark:text-amber-100">
              Create a student group first (Groups tab), then register students
              into it.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="fn">First name</PixelLabel>
              <PixelInput
                id="fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ln">Last name</PixelLabel>
              <PixelInput
                id="ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="sid">Student ID</PixelLabel>
              <PixelInput
                id="sid"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="idx">Index number</PixelLabel>
              <PixelInput
                id="idx"
                value={indexNumber}
                onChange={(e) => setIndexNumber(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="em">Email (login)</PixelLabel>
              <PixelInput
                id="em"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph">Primary phone</PixelLabel>
              <PixelInput
                id="ph"
                placeholder="0241234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph2">Secondary phone</PixelLabel>
              <PixelInput
                id="ph2"
                value={secondaryPhone}
                onChange={(e) => setSecondary(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="wa">WhatsApp</PixelLabel>
              <PixelInput
                id="wa"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="wk">Weekly fee (GHS)</PixelLabel>
              <PixelInput
                id="wk"
                type="number"
                step="0.01"
                value={weeklyAmount}
                onChange={(e) => setWeekly(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="grp">Student group</PixelLabel>
              <PixelSelect
                id="grp"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
              >
                <option value="">Select group (floor / block)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.hall?.code ?? "Hall"} · Fl. {g.floor} · Bl.{" "}
                    {g.block}
                  </option>
                ))}
              </PixelSelect>
              {selectedGroup && (
                <p className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                  Hostel: {selectedGroup.hall?.name} · Floor{" "}
                  {selectedGroup.floor} · Block {selectedGroup.block}
                </p>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="room">Room number (type it)</PixelLabel>
              <PixelInput
                id="room"
                placeholder="e.g. 12B or 204"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="tpw">Temporary password (optional)</PixelLabel>
              <PixelInput
                id="tpw"
                type="text"
                placeholder="Auto-generated if left blank"
                value={temporaryPassword}
                onChange={(e) => setTempPw(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving || groups.length === 0}>
              {saving ? "Saving..." : "Create student account"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  student,
  onClose,
  onDone,
}: {
  student: StudentDTO | null;
  onClose: () => void;
  onDone: () => void;
}) {
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
        amountPaid: amt,
        amountDue:
          student.weeklyAmount != null ? Number(student.weeklyAmount) : amt,
        method,
        reference: reference || undefined,
      });
      toast.success(
        `GHS ${amt.toFixed(2)} recorded — ${student.firstName} notified.`
      );
      onDone();
      onClose();
      setAmount("");
      setReference("");
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
          <DialogTitle className="font-black uppercase tracking-wider">
            Record payment
          </DialogTitle>
          <DialogDescription>
            Payment from{" "}
            <strong>
              {student?.firstName} {student?.lastName}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="amount">Amount paid (GHS)</PixelLabel>
            <PixelInput
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="method">Method</PixelLabel>
            <PixelSelect
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </PixelSelect>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="ref">Reference</PixelLabel>
            <PixelInput
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Record payment"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BroadcastDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    setSaving(true);
    const toastId = toast.loading("Sending broadcast SMS…");
    try {
      const result = await api.post<{ sms?: number; recipients?: number }>(
        "/api/v1/notifications",
        {
          target: "all",
          title: title.trim(),
          body: body.trim(),
          channels: ["SMS"],
        }
      );
      toast.success(
        `Broadcast sent${result?.sms != null ? ` (${result.sms} SMS)` : ""}.`,
        { id: toastId }
      );
      onClose();
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not send broadcast.", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">
            Notify all students
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="bt">Title</PixelLabel>
            <PixelInput
              id="bt"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="bb">Message</PixelLabel>
            <PixelTextarea
              id="bb"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <PixelButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving} aria-busy={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
                </>
              ) : (
                "Send SMS"
              )}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
