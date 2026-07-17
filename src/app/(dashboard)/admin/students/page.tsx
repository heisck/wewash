"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/use-persisted-state";
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
  KeyRound,
  Bell,
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
import { LocationFilterBar } from "@/components/admin/location-filter-bar";
import { useAdminLocationFilter } from "@/hooks/use-admin-location-filter";
import {
  matchStudentLocation,
  matchGroupLocation,
} from "@/lib/admin/location-filter";
import type {
  StudentDTO,
  HallDTO,
  StudentGroupDTO,
} from "@/lib/types/client";

type Tab = "roster" | "groups";

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const cedis = (n: string | number | undefined) => {
  const v = Number(n ?? 0);
  return `₵${(Number.isFinite(v) ? v : 0).toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

function washLabel(s: StudentDTO): string {
  const slots = s.scheduleSlots ?? [];
  if (slots.length === 0) {
    const days = s.scheduleDays ?? [];
    if (!days.length) return "—";
    return days.map((d) => DAY_SHORT[d] ?? d.slice(0, 3)).join(", ");
  }
  return slots
    .map(
      (sl) =>
        `${DAY_SHORT[sl.dayOfWeek] ?? sl.dayOfWeek.slice(0, 3)} ${sl.startTime}`
    )
    .join(", ");
}

export default function AdminStudents() {
  const {
    data: students,
    reload: reloadStudents,
    loading: studentsLoading,
    error: studentsError,
  } = useApi<StudentDTO[]>("/api/v1/students?limit=200");
  const { data: halls } = useApi<HallDTO[]>("/api/v1/halls?limit=100");
  const { data: groups, reload: reloadGroups } = useApi<StudentGroupDTO[]>(
    "/api/v1/student-groups?limit=200"
  );
  const { filter } = useAdminLocationFilter();

  const [tab, setTab] = usePersistedState<Tab>("admin/students:tab", "roster");
  const [searchTerm, setSearchTerm] = usePersistedState(
    "admin/students:search",
    ""
  );
  const [registerOpen, setRegisterOpen] = usePersistedState(
    "admin/students:registerOpen",
    false
  );
  const [groupOpen, setGroupOpen] = usePersistedState(
    "admin/students:groupOpen",
    false
  );
  const [broadcastOpen, setBroadcastOpen] = usePersistedState(
    "admin/students:broadcastOpen",
    false
  );
  /** Expand room key: `${groupId ?? "none"}::${roomKey}` */
  const [expandedRoomKey, setExpandedRoomKey] = usePersistedState<string | null>(
    "admin/students:expandedRoomKey",
    null
  );
  /** Student id while an SMS action is in flight (not persisted) */
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Room key while room broadcast is in flight */
  const [busyRoomKey, setBusyRoomKey] = useState<string | null>(null);

  const list = useMemo(
    () => (students ?? []).filter((s) => matchStudentLocation(s, filter)),
    [students, filter]
  );
  const groupList = useMemo(
    () => (groups ?? []).filter((g) => matchGroupLocation(g, filter)),
    [groups, filter]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.roomNumber ?? s.room?.number ?? "").toLowerCase().includes(q) ||
        (s.group?.name ?? "").toLowerCase().includes(q) ||
        (s.group?.floor ?? "").toLowerCase().includes(q) ||
        (s.group?.block ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
    );
  }, [list, searchTerm]);

  /**
   * Hierarchy: Group → Room (roommates) → Students.
   * Empty groups (no matching students) still appear if search is empty.
   */
  const hierarchy = useMemo(() => {
    type RoomBucket = {
      key: string;
      roomLabel: string;
      students: StudentDTO[];
    };
    type GroupBucket = {
      groupId: string | null;
      title: string;
      subtitle: string;
      rooms: RoomBucket[];
      studentCount: number;
    };

    const byGroup = new Map<string, StudentDTO[]>();
    for (const s of filtered) {
      const gid = s.groupId ?? s.group?.id ?? "__ungrouped__";
      const arr = byGroup.get(gid) ?? [];
      arr.push(s);
      byGroup.set(gid, arr);
    }

    const buckets: GroupBucket[] = [];

    // Prefer known groups order from groupList
    for (const g of groupList) {
      const members = byGroup.get(g.id) ?? [];
      if (searchTerm.trim() && members.length === 0) continue;

      const roomMap = new Map<string, StudentDTO[]>();
      for (const s of members) {
        const roomKey =
          s.roomId ||
          s.roomNumber ||
          s.room?.number ||
          "__no_room__";
        const arr = roomMap.get(roomKey) ?? [];
        arr.push(s);
        roomMap.set(roomKey, arr);
      }

      const rooms: RoomBucket[] = Array.from(roomMap.entries())
        .map(([key, students]) => {
          const label =
            key === "__no_room__"
              ? "No room"
              : students[0]?.roomNumber ||
                students[0]?.room?.number ||
                key;
          return {
            key: `${g.id}::${key}`,
            roomLabel: label,
            students: students.sort((a, b) =>
              a.lastName.localeCompare(b.lastName)
            ),
          };
        })
        .sort((a, b) =>
          a.roomLabel.localeCompare(b.roomLabel, undefined, { numeric: true })
        );

      buckets.push({
        groupId: g.id,
        title: g.name,
        subtitle: `${g.hall?.name ?? "Hostel"} · Floor ${g.floor} · Block ${g.block}`,
        rooms,
        studentCount: members.length,
      });
      byGroup.delete(g.id);
    }

    // Any leftover (ungrouped / orphan group ids)
    for (const [gid, members] of byGroup) {
      if (members.length === 0) continue;
      const roomMap = new Map<string, StudentDTO[]>();
      for (const s of members) {
        const roomKey =
          s.roomId || s.roomNumber || s.room?.number || "__no_room__";
        const arr = roomMap.get(roomKey) ?? [];
        arr.push(s);
        roomMap.set(roomKey, arr);
      }
      const rooms: RoomBucket[] = Array.from(roomMap.entries())
        .map(([key, students]) => ({
          key: `${gid}::${key}`,
          roomLabel:
            key === "__no_room__"
              ? "No room"
              : students[0]?.roomNumber ||
                students[0]?.room?.number ||
                key,
          students: students.sort((a, b) =>
            a.lastName.localeCompare(b.lastName)
          ),
        }))
        .sort((a, b) =>
          a.roomLabel.localeCompare(b.roomLabel, undefined, { numeric: true })
        );

      const sample = members[0]?.group;
      buckets.push({
        groupId: gid === "__ungrouped__" ? null : gid,
        title:
          gid === "__ungrouped__"
            ? "Ungrouped"
            : sample?.name ?? "Other group",
        subtitle:
          gid === "__ungrouped__"
            ? "Students without a group assignment"
            : sample
              ? `Floor ${sample.floor} · Block ${sample.block}`
              : "",
        rooms,
        studentCount: members.length,
      });
    }

    return buckets;
  }, [filtered, groupList, searchTerm]);

  const reloadAll = () => {
    reloadStudents();
    reloadGroups();
  };

  const sendReminder = async (s: StudentDTO) => {
    if (busyId) return;
    if (!s.phone?.trim()) {
      toast.error(`No phone number for ${s.firstName} — cannot send SMS.`);
      return;
    }
    const due = Number(s.weeklyAmount ?? 0);
    const remaining =
      s.remaining != null
        ? s.remaining
        : Math.max(0, due - Number(s.paidThisWeek ?? 0));
    const body =
      due <= 0
        ? `Hi ${s.firstName}, a note from WeWash. Open the app for your schedule. - WeWash`
        : s.isPaidInFull
          ? `Hi ${s.firstName}, thanks — this week's WeWash dues (${cedis(due)}) are paid in full. - WeWash`
          : remaining > 0 && Number(s.paidThisWeek ?? 0) > 0
            ? `Hi ${s.firstName}, GHS ${Number(s.paidThisWeek).toFixed(0)} confirmed — ${cedis(remaining)} left this week (fee ${cedis(due)}). Pay off-app and upload proof. - WeWash`
            : `Hi ${s.firstName}, please pay ${cedis(due)} WeWash dues this week (Mon–Sun). Pay off-app and upload proof in the app. - WeWash`;

    setBusyId(s.id);
    const toastId = toast.loading(`Sending SMS to ${s.firstName}…`);
    try {
      const result = await api.post<{
        sms?: number;
        push?: number;
        recipients?: number;
      }>("/api/v1/notifications", {
        target: "selected",
        studentIds: [s.id],
        title: "WeWash payment reminder",
        body,
        channels: ["SMS", "PUSH"],
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
      setBusyId(null);
    }
  };

  const resendWelcome = async (s: StudentDTO) => {
    if (busyId) return;
    if (!s.phone?.trim()) {
      toast.error(`No phone for ${s.firstName} — cannot send welcome SMS.`);
      return;
    }
    setBusyId(s.id);
    const toastId = toast.loading(`Sending welcome SMS to ${s.firstName}…`);
    try {
      await api.post(`/api/v1/students/${s.id}/welcome`);
      toast.success(`Welcome SMS sent to ${s.firstName} (${s.phone}).`, {
        id: toastId,
      });
    } catch (e) {
      toast.error(
        (e as ApiError).message || `Could not send welcome to ${s.firstName}.`,
        { id: toastId }
      );
    } finally {
      setBusyId(null);
    }
  };

  const notifyRoom = async (roomKey: string, roommates: StudentDTO[]) => {
    if (busyRoomKey) return;
    const ids = roommates.map((s) => s.id);
    if (!ids.length) return;
    const label =
      roommates[0]?.roomNumber ||
      roommates[0]?.room?.number ||
      "this room";
    const wash = washLabel(roommates[0]!);
    setBusyRoomKey(roomKey);
    const toastId = toast.loading(`Notifying Room ${label}…`);
    try {
      const result = await api.post<{ sms?: number }>("/api/v1/notifications", {
        target: "selected",
        studentIds: ids,
        title: "WeWash room notice",
        body:
          wash !== "—"
            ? `Room ${label}: your wash slot is ${wash}. Open WeWash for details. - WeWash`
            : `Room ${label}: check WeWash for your schedule and weekly dues. - WeWash`,
        channels: ["SMS", "PUSH"],
      });
      toast.success(
        `Notified Room ${label}${result?.sms != null ? ` (${result.sms} SMS)` : ""}.`,
        { id: toastId }
      );
    } catch (e) {
      toast.error((e as ApiError).message || "Could not notify room.", {
        id: toastId,
      });
    } finally {
      setBusyRoomKey(null);
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

      <LocationFilterBar halls={halls} groups={groups} />

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

          {studentsLoading && !students ? (
            <PixelCard className="flex items-center justify-center gap-2 py-12 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
            </PixelCard>
          ) : studentsError ? (
            <PixelCard className="py-12 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-300">
                Could not load students
              </p>
              <p className="mt-2 text-[11px] font-semibold text-teal-900/55">
                {studentsError.message}
              </p>
              <PixelButton className="mt-4" size="sm" onClick={() => reloadStudents()}>
                Retry
              </PixelButton>
            </PixelCard>
          ) : hierarchy.length === 0 ? (
            <PixelCard className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              {list.length === 0
                ? "No students yet — create a group, then register."
                : "No matching students."}
            </PixelCard>
          ) : (
            <div className="space-y-6">
              {hierarchy.map((group) => (
                <section key={group.groupId ?? "ungrouped"} className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-teal-900/15 pb-2 dark:border-teal-100/15">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
                        {group.title}
                      </h2>
                      {group.subtitle && (
                        <p className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                          {group.subtitle}
                        </p>
                      )}
                    </div>
                    <PixelBadge tone="teal">
                      {group.studentCount} student
                      {group.studentCount === 1 ? "" : "s"} ·{" "}
                      {group.rooms.length} room
                      {group.rooms.length === 1 ? "" : "s"}
                    </PixelBadge>
                  </div>

                  {group.rooms.length === 0 ? (
                    <PixelCard className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-teal-900/35">
                      No students in this group yet
                    </PixelCard>
                  ) : (
                    <div className="space-y-2">
                      {group.rooms.map((room) => {
                        const open = expandedRoomKey === room.key;
                        return (
                          <PixelCard key={room.key} className="overflow-hidden">
                            {/* Header row: expand control + notify as siblings (no nested buttons) */}
                            <div className="flex items-stretch">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRoomKey(open ? null : room.key)
                                }
                                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5"
                                aria-expanded={open}
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-teal-900/15 dark:border-teal-100/20">
                                  {open ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-black uppercase tracking-widest text-teal-950 dark:text-teal-50">
                                    Room {room.roomLabel}
                                  </p>
                                  <p className="truncate text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                                    {room.students.length} roommate
                                    {room.students.length === 1 ? "" : "s"}
                                    {room.students.length
                                      ? ` · ${room.students
                                          .map((s) => s.firstName)
                                          .join(", ")}`
                                      : ""}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {washLabel(room.students[0]!) !== "—" && (
                                    <span className="hidden text-[9px] font-bold uppercase tracking-wider text-teal-900/45 sm:inline dark:text-teal-100/45">
                                      {washLabel(room.students[0]!)}
                                    </span>
                                  )}
                                  <PixelBadge
                                    tone={
                                      room.students.length > 1
                                        ? "amber"
                                        : "slate"
                                    }
                                  >
                                    {room.students.length > 1
                                      ? "Roommates"
                                      : "Single"}
                                  </PixelBadge>
                                </div>
                              </button>
                              <div className="flex shrink-0 items-center border-l-2 border-teal-900/10 pr-3 dark:border-teal-100/10">
                                <PixelButton
                                  size="sm"
                                  variant="ghost"
                                  type="button"
                                  disabled={!!busyRoomKey}
                                  title="SMS everyone in this room"
                                  onClick={() =>
                                    void notifyRoom(room.key, room.students)
                                  }
                                >
                                  {busyRoomKey === room.key ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Bell className="h-3.5 w-3.5" />
                                  )}
                                </PixelButton>
                              </div>
                            </div>

                            {open && (
                              <div className="border-t-2 border-teal-900/10 dark:border-teal-100/10">
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-200 text-left">
                                    <thead>
                                      <tr className="border-b border-teal-900/10 dark:border-teal-100/10">
                                        <PixelTh>Student</PixelTh>
                                        <PixelTh>Phone</PixelTh>
                                        <PixelTh>Wash day</PixelTh>
                                        <PixelTh>This week</PixelTh>
                                        <PixelTh>Status</PixelTh>
                                        <PixelTh className="text-right">
                                          Actions
                                        </PixelTh>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-teal-900/5 dark:divide-teal-100/5">
                                      {room.students.map((s) => {
                                        const due = Number(s.weeklyAmount ?? 0);
                                        const paidFull =
                                          s.isPaidInFull === true || due <= 0;
                                        return (
                                          <tr
                                            key={s.id}
                                            className="bg-teal-600/3 dark:bg-teal-400/3"
                                          >
                                            <PixelTd className="font-black">
                                              {s.firstName} {s.lastName}
                                              <p className="text-[9px] font-semibold text-teal-900/45 dark:text-teal-100/45">
                                                {s.studentId}
                                                {s.email ? ` · ${s.email}` : ""}
                                              </p>
                                            </PixelTd>
                                            <PixelTd className="font-mono text-[10px]">
                                              {s.phone || "—"}
                                            </PixelTd>
                                            <PixelTd className="text-[10px] font-bold text-teal-900/70 dark:text-teal-100/70">
                                              {washLabel(s)}
                                            </PixelTd>
                                            <PixelTd>
                                              {due <= 0 ? (
                                                <PixelBadge tone="slate">
                                                  No fee
                                                </PixelBadge>
                                              ) : paidFull ? (
                                                <PixelBadge tone="green">
                                                  Paid {cedis(due)}
                                                </PixelBadge>
                                              ) : (
                                                <PixelBadge tone="amber">
                                                  {cedis(s.remaining ?? due)} left
                                                </PixelBadge>
                                              )}
                                            </PixelTd>
                                            <PixelTd>
                                              <PixelBadge
                                                tone={
                                                  s.isActive ? "green" : "slate"
                                                }
                                              >
                                                {s.isActive
                                                  ? "ACTIVE"
                                                  : "INACTIVE"}
                                              </PixelBadge>
                                            </PixelTd>
                                            <PixelTd className="text-right">
                                              <div className="flex flex-wrap justify-end gap-2">
                                                <Link
                                                  href={`/admin/payments?student=${s.id}`}
                                                  title="Open this student on Payments"
                                                  className="inline-flex h-8 items-center justify-center gap-1 border-2 border-teal-900/25 bg-transparent px-2 text-[10px] font-black uppercase tracking-widest text-teal-900 shadow-pixel-sm transition hover:bg-teal-600/10 dark:border-teal-100/25 dark:text-teal-100"
                                                >
                                                  <CreditCard className="h-3 w-3" />
                                                  Payments
                                                </Link>
                                                <PixelButton
                                                  size="sm"
                                                  variant="ghost"
                                                  disabled={!!busyId}
                                                  aria-busy={busyId === s.id}
                                                  onClick={() =>
                                                    void sendReminder(s)
                                                  }
                                                  title="Send payment SMS reminder"
                                                >
                                                  {busyId === s.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                  ) : (
                                                    <Send className="h-3.5 w-3.5" />
                                                  )}
                                                </PixelButton>
                                                <PixelButton
                                                  size="sm"
                                                  variant="ghost"
                                                  disabled={!!busyId}
                                                  onClick={() =>
                                                    void resendWelcome(s)
                                                  }
                                                  title="Resend welcome / login SMS"
                                                >
                                                  <KeyRound className="h-3.5 w-3.5" />
                                                </PixelButton>
                                                <PixelButton
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() =>
                                                    void removeStudent(s)
                                                  }
                                                  title="Remove student"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </PixelButton>
                                              </div>
                                            </PixelTd>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </PixelCard>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
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
        groups={groups ?? []}
        onDone={reloadAll}
      />
      <CreateGroupDialog
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        halls={halls ?? []}
        onDone={reloadAll}
      />
      <BroadcastDialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
      />
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
  const [draft, setDraft] = usePersistedState("admin/students:groupDraft", {
    name: "",
    hallId: "",
    floor: "",
    block: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const { name, hallId, floor, block, notes } = draft;
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

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
      setDraft({ name: "", hallId: "", floor: "", block: "", notes: "" });
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
              onChange={(e) => set("hallId", e.target.value)}
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
                onChange={(e) => set("floor", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="g-block">Block</PixelLabel>
              <PixelInput
                id="g-block"
                placeholder="e.g. A"
                value={block}
                onChange={(e) => set("block", e.target.value)}
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
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="g-notes">Notes</PixelLabel>
            <PixelTextarea
              id="g-notes"
              value={notes}
              onChange={(e) => set("notes", e.target.value)}
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
type RegisterDraft = {
  firstName: string;
  lastName: string;
  studentId: string;
  indexNumber: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  whatsapp: string;
  weeklyAmount: string;
  temporaryPassword: string;
  groupId: string;
  roomNumber: string;
};

const emptyRegisterDraft = (): RegisterDraft => ({
  firstName: "",
  lastName: "",
  studentId: "",
  indexNumber: "",
  email: "",
  phone: "",
  secondaryPhone: "",
  whatsapp: "",
  weeklyAmount: "",
  temporaryPassword: "",
  groupId: "",
  roomNumber: "",
});

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
  const [draft, setDraft] = usePersistedState<RegisterDraft>(
    "admin/students:registerDraft",
    emptyRegisterDraft()
  );
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof RegisterDraft>(
    key: K,
    value: RegisterDraft[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const {
    firstName,
    lastName,
    studentId,
    indexNumber,
    email,
    phone,
    secondaryPhone,
    whatsapp,
    weeklyAmount,
    temporaryPassword,
    groupId,
    roomNumber,
  } = draft;

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
      toast.success(
        `${firstName} registered in ${selectedGroup?.name ?? "group"}. Welcome SMS sent to ${phone}.`
      );
      onDone();
      onClose();
      setDraft(emptyRegisterDraft());
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
                onChange={(e) => set("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ln">Last name</PixelLabel>
              <PixelInput
                id="ln"
                value={lastName}
                onChange={(e) => set("lastName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="sid">Student ID</PixelLabel>
              <PixelInput
                id="sid"
                value={studentId}
                onChange={(e) => set("studentId", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="idx">Index number</PixelLabel>
              <PixelInput
                id="idx"
                value={indexNumber}
                onChange={(e) => set("indexNumber", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="em">Email (login)</PixelLabel>
              <PixelInput
                id="em"
                type="email"
                value={email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph">Primary phone</PixelLabel>
              <PixelInput
                id="ph"
                placeholder="0241234567"
                value={phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ph2">Secondary phone</PixelLabel>
              <PixelInput
                id="ph2"
                value={secondaryPhone}
                onChange={(e) => set("secondaryPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="wa">WhatsApp</PixelLabel>
              <PixelInput
                id="wa"
                value={whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="wk">Weekly fee (GHS)</PixelLabel>
              <PixelInput
                id="wk"
                type="number"
                step="0.01"
                value={weeklyAmount}
                onChange={(e) => set("weeklyAmount", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <PixelLabel htmlFor="grp">Student group</PixelLabel>
              <PixelSelect
                id="grp"
                value={groupId}
                onChange={(e) => set("groupId", e.target.value)}
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
                onChange={(e) => set("roomNumber", e.target.value)}
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
                onChange={(e) => set("temporaryPassword", e.target.value)}
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

function BroadcastDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = usePersistedState("admin/students:broadcastDraft", {
    title: "",
    body: "",
  });
  const { title, body } = draft;
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
      setDraft({ title: "", body: "" });
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
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="bb">Message</PixelLabel>
            <PixelTextarea
              id="bb"
              value={body}
              onChange={(e) =>
                setDraft((d) => ({ ...d, body: e.target.value }))
              }
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
