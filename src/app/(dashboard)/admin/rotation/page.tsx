"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  WashingMachine,
  UsersRound,
} from "lucide-react";
import {
  PageTitle,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
} from "@/components/pixel/pixel-ui";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { LocationFilterBar } from "@/components/admin/location-filter-bar";
import { useAdminLocationFilter } from "@/hooks/use-admin-location-filter";
import { matchGroupLocation } from "@/lib/admin/location-filter";
import { api, useApi, ApiError } from "@/lib/api/client";
import type {
  HallDTO,
  MachineDTO,
  MachineScheduleDTO,
  StudentGroupDTO,
  ContactConfig,
} from "@/lib/types/client";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_SHORT: Record<(typeof DAYS)[number], string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

type Day = (typeof DAYS)[number];

type RoomRow = {
  id: string;
  number: string;
  studentCount: number;
  students: { firstName: string; lastName: string }[];
};

type ViewLevel = "groups" | "machines" | "schedule";

/** Normalize HTML time input / API values to HH:MM */
function toHHmm(value: string | undefined | null, fallback = "08:00"): string {
  if (!value) return fallback;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function machineLabel(m: MachineDTO | null | undefined) {
  if (!m) return "Machine";
  return m.code || m.name || m.serialNumber || "Machine";
}

function schedulesOf(m: MachineDTO | null | undefined): MachineScheduleDTO[] {
  if (!m) return [];
  return (
    m.schedules ??
    (m as { machineSchedules?: MachineScheduleDTO[] }).machineSchedules ??
    []
  );
}

export default function AdminRotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          Loading rotation…
        </div>
      }
    >
      <RotationInner />
    </Suspense>
  );
}

function RotationInner() {
  const search = useSearchParams();
  const presetMachine = search.get("machine") ?? "";

  const { data: machines, loading: machinesLoading } = useApi<MachineDTO[]>(
    "/api/v1/machines?limit=100"
  );
  const { data: groups, loading: groupsLoading } = useApi<StudentGroupDTO[]>(
    "/api/v1/student-groups?limit=200"
  );
  const { data: halls } = useApi<HallDTO[]>("/api/v1/halls?limit=100");
  const { data: contact } = useApi<ContactConfig>("/api/v1/public/contact");
  const { filter: locFilter } = useAdminLocationFilter();

  const settingsHandoff = toHHmm(contact?.rotationHandoffTime, "08:00");

  const [groupId, setGroupId] = usePersistedState("admin/rotation:groupId", "");
  const [machineId, setMachineId] = usePersistedState(
    "admin/rotation:machineId",
    presetMachine
  );
  /** roomId → washing days */
  const [roomDays, setRoomDays] = usePersistedState<Record<string, Day[]>>(
    "admin/rotation:roomDays",
    {}
  );
  const [roomTimes, setRoomTimes] = usePersistedState<Record<string, string>>(
    "admin/rotation:roomTimes",
    {}
  );
  const [handoff, setHandoff] = usePersistedState(
    "admin/rotation:handoff",
    settingsHandoff
  );
  const [useSettingsHandoff, setUseSettingsHandoff] = usePersistedState(
    "admin/rotation:useSettingsHandoff",
    true
  );
  const [saving, setSaving] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);

  const list = machines ?? [];
  const groupList = useMemo(
    () => (groups ?? []).filter((g) => matchGroupLocation(g, locFilter)),
    [groups, locFilter]
  );
  const selectedGroup =
    (groups ?? []).find((g) => g.id === groupId) ?? null;
  const selectedMachine =
    machineId && list.length > 0
      ? (list.find((m) => m.id === machineId) ?? null)
      : null;

  // Drop stale persisted machine id once the list has loaded without it
  useEffect(() => {
    if (!machineId) return;
    if (machinesLoading) return;
    if (!machines) return;
    if (list.some((m) => m.id === machineId)) return;
    setMachineId("");
  }, [machineId, machines, machinesLoading, list, setMachineId]);

  // Drill-down level from selection.
  // Only enter schedule view once the machine exists in the loaded list
  // (avoids null machineLabel crash while machines are still fetching or ID is stale).
  const level: ViewLevel =
    groupId && machineId && selectedMachine
      ? "schedule"
      : groupId
        ? "machines"
        : "groups";

  const { data: details, reload } = useApi<
    MachineDTO & { schedules?: MachineScheduleDTO[] }
  >(machineId && selectedMachine ? `/api/v1/machines/${machineId}` : null);

  const { data: groupDetail, reload: reloadGroup, loading: groupDetailLoading } =
    useApi<StudentGroupDTO & { rooms?: RoomRow[] }>(
      groupId ? `/api/v1/student-groups/${groupId}` : null
    );

  const rooms: RoomRow[] = useMemo(() => {
    const raw = groupDetail?.rooms ?? [];
    return raw.map((r) => ({
      id: r.id,
      number: r.number,
      studentCount: r.studentCount,
      students: r.students ?? [],
    }));
  }, [groupDetail]);

  const roomIds = useMemo(() => new Set(rooms.map((r) => r.id)), [rooms]);

  /**
   * Machines for this group:
   * - same hall as the group, or
   * - already scheduled on any of this group's rooms, or
   * - no hall set (available to assign)
   */
  const machinesForGroup = useMemo(() => {
    if (!selectedGroup) return [];
    const hallId = selectedGroup.hallId;
    return list.filter((m) => {
      if (m.hallId && m.hallId === hallId) return true;
      if (!m.hallId) return true;
      const sched = schedulesOf(m);
      return sched.some((s) => roomIds.has(s.roomId));
    });
  }, [list, selectedGroup, roomIds]);

  useEffect(() => {
    if (presetMachine) setMachineId(presetMachine);
  }, [presetMachine, setMachineId]);

  useEffect(() => {
    if (useSettingsHandoff && settingsHandoff) {
      setHandoff(settingsHandoff);
    }
  }, [settingsHandoff, useSettingsHandoff, setHandoff]);

  // Hydrate draft from machine schedule when entering schedule view
  useEffect(() => {
    if (!machineId) {
      setRoomDays({});
      setRoomTimes({});
      return;
    }
    const schedules =
      (details?.schedules as MachineScheduleDTO[] | undefined) ??
      (details as { machineSchedules?: MachineScheduleDTO[] } | null)
        ?.machineSchedules ??
      [];

    const daysMap: Record<string, Day[]> = {};
    const timesMap: Record<string, string> = {};
    for (const s of schedules) {
      if (!DAYS.includes(s.dayOfWeek as Day)) continue;
      const day = s.dayOfWeek as Day;
      daysMap[s.roomId] = [...(daysMap[s.roomId] ?? []), day];
      if (s.startTime) timesMap[s.roomId] = toHHmm(s.startTime);
    }
    for (const id of Object.keys(daysMap)) {
      daysMap[id] = (daysMap[id] ?? []).sort(
        (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
      );
    }
    setRoomDays(daysMap);
    setRoomTimes(timesMap);

    if (schedules[0]?.startTime && !useSettingsHandoff) {
      setHandoff(toHHmm(schedules[0].startTime));
    }
  }, [machineId, details, useSettingsHandoff, setRoomDays, setRoomTimes, setHandoff]);

  // Keep only rooms in the selected group
  useEffect(() => {
    if (!groupId || rooms.length === 0) return;
    setRoomDays((prev) => {
      const next: Record<string, Day[]> = {};
      for (const r of rooms) {
        next[r.id] = prev[r.id] ?? [];
      }
      return next;
    });
    setRoomTimes((prev) => {
      const next: Record<string, string> = {};
      for (const r of rooms) {
        if (prev[r.id]) next[r.id] = prev[r.id]!;
      }
      return next;
    });
  }, [groupId, rooms, setRoomDays, setRoomTimes]);

  const globalHandoff = useSettingsHandoff ? settingsHandoff : toHHmm(handoff);

  const dayUsedByRoom = useMemo(() => {
    const map = new Map<Day, { roomId: string; roomNumber: string }>();
    const roomNum = (id: string) =>
      rooms.find((r) => r.id === id)?.number ?? id.slice(0, 6);
    for (const [roomId, days] of Object.entries(roomDays)) {
      for (const d of days) {
        map.set(d, { roomId, roomNumber: roomNum(roomId) });
      }
    }
    return map;
  }, [roomDays, rooms]);

  const daysBlockedByOtherMachines = useMemo(() => {
    const map = new Map<string, Map<Day, string>>();
    for (const m of list) {
      if (!machineId || m.id === machineId) continue;
      const schedules = schedulesOf(m);
      const label = machineLabel(m);
      for (const s of schedules) {
        if (!roomIds.has(s.roomId)) continue;
        if (!DAYS.includes(s.dayOfWeek as Day)) continue;
        const day = s.dayOfWeek as Day;
        if (!map.has(s.roomId)) map.set(s.roomId, new Map());
        map.get(s.roomId)!.set(day, label);
      }
    }
    return map;
  }, [list, machineId, roomIds]);

  const toggleDay = (roomId: string, day: Day) => {
    const owner = dayUsedByRoom.get(day);
    if (owner && owner.roomId !== roomId) return;
    if (daysBlockedByOtherMachines.get(roomId)?.has(day)) return;

    setRoomDays((prev) => {
      const current = new Set(prev[roomId] ?? []);
      if (current.has(day)) current.delete(day);
      else current.add(day);
      return {
        ...prev,
        [roomId]: Array.from(current).sort(
          (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
        ),
      };
    });
  };

  const slots = useMemo(() => {
    const out: {
      roomId: string;
      dayOfWeek: Day;
      startTime: string;
      orderIndex: number;
    }[] = [];
    for (const [roomId, days] of Object.entries(roomDays)) {
      const time = toHHmm(roomTimes[roomId] || globalHandoff);
      for (const day of days) {
        out.push({
          roomId,
          dayOfWeek: day,
          startTime: time,
          orderIndex: DAYS.indexOf(day),
        });
      }
    }
    return out.sort((a, b) => a.orderIndex - b.orderIndex);
  }, [roomDays, roomTimes, globalHandoff]);

  const save = async () => {
    if (!machineId) return toast.error("Select a machine first.");
    if (!groupId) return toast.error("Select a student group first.");
    if (rooms.length === 0)
      return toast.error(
        "Add at least one room first (Add room), or register students with room numbers."
      );
    if (slots.length === 0)
      return toast.error("Pick at least one day for a room.");

    // Only rewrite this group's rooms — other groups on the same machine stay.
    const scopeRoomIds = rooms.map((r) => r.id);

    setSaving(true);
    try {
      await api.put(`/api/v1/machines/${machineId}`, {
        schedules: slots.map((s, i) => ({
          roomId: s.roomId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.startTime,
          orderIndex: i,
        })),
        scopeRoomIds,
      });
      toast.success(
        `Rotation saved — ${slots.length} slot(s) across ${
          Object.values(roomDays).filter((d) => d.length).length
        } room(s). New/changed slots SMS students; existing rooms stay as-is.`
      );
      reload();
      reloadGroup();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const addRoom = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!groupId) return;
    const num = newRoomNumber.trim();
    if (!num) return toast.error("Type a room number.");
    setAddingRoom(true);
    try {
      await api.post(`/api/v1/student-groups/${groupId}/rooms`, {
        roomNumber: num,
      });
      toast.success(
        `Room ${num} ready. Tick wash days below — roommates share one slot.`
      );
      setNewRoomNumber("");
      setShowAddRoom(false);
      reloadGroup();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not add room.");
    } finally {
      setAddingRoom(false);
    }
  };

  const openGroup = (id: string) => {
    setGroupId(id);
    setMachineId("");
    setRoomDays({});
    setRoomTimes({});
  };

  const openMachine = (id: string) => {
    setMachineId(id);
  };

  const backToGroups = () => {
    setGroupId("");
    setMachineId("");
    setRoomDays({});
    setRoomTimes({});
  };

  const backToMachines = () => {
    setMachineId("");
    setRoomDays({});
    setRoomTimes({});
  };

  /** Schedule summary for a machine within this group's rooms */
  const machineGroupSummary = (m: MachineDTO) => {
    const sched = schedulesOf(m).filter((s) => roomIds.has(s.roomId));
    const roomSet = new Set(sched.map((s) => s.roomId));
    const days = [
      ...new Set(
        sched
          .map((s) => s.dayOfWeek)
          .filter((d): d is Day => DAYS.includes(d as Day))
      ),
    ].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    return {
      slotCount: sched.length,
      roomCount: roomSet.size,
      days,
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="ROTATION"
          sub={
            level === "groups"
              ? "Pick a group, then a machine, then assign room wash days"
              : level === "machines"
                ? `Machines for ${selectedGroup?.name ?? "group"}`
                : selectedMachine
                  ? `Room schedule · ${machineLabel(selectedMachine)}`
                  : "Room schedule"
          }
        />
        {level === "schedule" && (
          <PixelButton
            onClick={save}
            disabled={saving || !machineId || !groupId}
          >
            <Save className="h-3.5 w-3.5" />{" "}
            {saving ? "Saving..." : "Save schedule"}
          </PixelButton>
        )}
      </div>

      {level === "groups" && (
        <LocationFilterBar halls={halls} groups={groups} />
      )}

      {/* Breadcrumb */}
      <nav
        aria-label="Rotation navigation"
        className="flex flex-wrap items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50"
      >
        <button
          type="button"
          onClick={backToGroups}
          className={
            level === "groups"
              ? "text-teal-950 dark:text-teal-50"
              : "hover:text-teal-900 dark:hover:text-teal-100"
          }
        >
          Groups
        </button>
        {selectedGroup && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
            <button
              type="button"
              onClick={backToMachines}
              className={
                level === "machines"
                  ? "text-teal-950 dark:text-teal-50"
                  : "hover:text-teal-900 dark:hover:text-teal-100"
              }
            >
              {selectedGroup.name}
            </button>
          </>
        )}
        {selectedMachine && level === "schedule" && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
            <span className="text-teal-950 dark:text-teal-50">
              {machineLabel(selectedMachine)}
            </span>
          </>
        )}
      </nav>

      {/* ─── Level 1: Groups ─── */}
      {level === "groups" && (
        <>
          {groupsLoading && !groups ? (
            <PixelCard className="flex items-center justify-center gap-2 py-16 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading groups…
            </PixelCard>
          ) : groupList.length === 0 ? (
            <PixelCard className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <UsersRound className="h-5 w-5 opacity-40" />
              <p>No student groups yet</p>
              <p className="max-w-sm font-semibold normal-case tracking-normal text-teal-900/50">
                Create a group on the Students page, register rooms, then set
                rotation here.
              </p>
            </PixelCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupList.map((g) => {
                // Machines available for this hostel (same hall or unassigned)
                const hallCount = list.filter(
                  (m) => m.hallId === g.hallId || !m.hallId
                ).length;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => openGroup(g.id)}
                    className="text-left transition-transform hover:-translate-y-0.5"
                  >
                    <PixelCard bolts className="h-full space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-teal-950 dark:text-teal-50">
                            {g.name}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                            {g.hall?.name ?? "Hostel"} · Floor {g.floor} · Block{" "}
                            {g.block}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-teal-900/30 dark:text-teal-100/30" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PixelBadge tone="teal">
                          {g._count?.students ?? 0} students
                        </PixelBadge>
                        <PixelBadge tone="slate">
                          {hallCount} machine
                          {hallCount === 1 ? "" : "s"}
                        </PixelBadge>
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/35 dark:text-teal-100/35">
                        Open → pick machine → set room days
                      </p>
                    </PixelCard>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Level 2: Machines in group ─── */}
      {level === "machines" && selectedGroup && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <PixelButton size="sm" variant="outline" onClick={backToGroups}>
              <ArrowLeft className="h-3.5 w-3.5" /> All groups
            </PixelButton>
            <PixelBadge tone="teal">{selectedGroup.name}</PixelBadge>
            <span className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
              {selectedGroup.hall?.code ?? "Hall"} · Fl. {selectedGroup.floor} ·
              Bl. {selectedGroup.block}
            </span>
          </div>

          {machinesLoading && !machines ? (
            <PixelCard className="flex items-center justify-center gap-2 py-16 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading machines…
            </PixelCard>
          ) : groupDetailLoading && rooms.length === 0 ? (
            <PixelCard className="flex items-center justify-center gap-2 py-16 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading group rooms…
            </PixelCard>
          ) : machinesForGroup.length === 0 ? (
            <PixelCard className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <WashingMachine className="h-5 w-5 opacity-40" />
              <p>No machines for this group&apos;s hostel</p>
              <p className="max-w-sm font-semibold normal-case tracking-normal text-teal-900/50">
                Add a machine on the Machines page and assign it to{" "}
                {selectedGroup.hall?.name ?? "this hostel"}, or leave hall blank.
              </p>
            </PixelCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {machinesForGroup.map((m) => {
                const summary = machineGroupSummary(m);
                const statusTone =
                  m.status === "ACTIVE"
                    ? "green"
                    : m.status === "MAINTENANCE" || m.status === "FAULTY"
                      ? "amber"
                      : "slate";
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => openMachine(m.id)}
                    className="text-left transition-transform hover:-translate-y-0.5"
                  >
                    <PixelCard bolts className="h-full space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-teal-950 dark:text-teal-50">
                            {machineLabel(m)}
                          </p>
                          <p className="mt-1 font-mono text-[10px] font-semibold text-teal-900/45 dark:text-teal-100/45">
                            {m.serialNumber}
                            {m.hall?.code ? ` · ${m.hall.code}` : " · No hall"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-teal-900/30" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PixelBadge tone={statusTone}>{m.status}</PixelBadge>
                        {summary.slotCount > 0 ? (
                          <PixelBadge tone="teal">
                            {summary.roomCount} room
                            {summary.roomCount === 1 ? "" : "s"} ·{" "}
                            {summary.days.map((d) => DAY_SHORT[d]).join("·") ||
                              `${summary.slotCount} slots`}
                          </PixelBadge>
                        ) : (
                          <PixelBadge tone="slate">No schedule yet</PixelBadge>
                        )}
                      </div>
                      {m.heldBy && (
                        <p className="text-[9px] font-bold text-teal-900/55 dark:text-teal-100/55">
                          Live: {m.heldBy.firstName} · Rm {m.heldBy.roomNumber}
                        </p>
                      )}
                      <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/35">
                        Open → set room wash days
                      </p>
                    </PixelCard>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Level 3: Room schedule editor ─── */}
      {level === "schedule" && selectedGroup && selectedMachine && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <PixelButton size="sm" variant="outline" onClick={backToMachines}>
                <ArrowLeft className="h-3.5 w-3.5" /> Machines
              </PixelButton>
              <PixelBadge tone="teal">{selectedGroup.name}</PixelBadge>
              <PixelBadge tone="slate">
                {machineLabel(selectedMachine)}
              </PixelBadge>
            </div>
            <PixelButton
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setShowAddRoom((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" /> Add room
            </PixelButton>
          </div>

          <PixelCard className="space-y-3 p-5">
            <PixelLabel htmlFor="handoff">Default handoff time</PixelLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-900/60 dark:text-teal-100/60">
                <input
                  type="checkbox"
                  checked={useSettingsHandoff}
                  onChange={(e) => setUseSettingsHandoff(e.target.checked)}
                  className="h-4 w-4 accent-teal-700"
                />
                Use Settings default ({settingsHandoff})
              </label>
              {!useSettingsHandoff && (
                <PixelInput
                  id="handoff"
                  type="time"
                  step={60}
                  value={toHHmm(handoff)}
                  onChange={(e) => setHandoff(toHHmm(e.target.value))}
                  className="max-w-40 font-mono tabular-nums"
                />
              )}
            </div>
            <p className="text-[10px] font-semibold text-teal-900/45 dark:text-teal-100/45">
              Schedule is <strong>per room</strong>, not per student. Adding a
              roommate to a room already on rotation does not re-add the room.
              Tick days per room; new/changed slots SMS students on save.
            </p>
          </PixelCard>

          {showAddRoom && (
            <PixelCard className="p-4">
              <form
                onSubmit={(e) => void addRoom(e)}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="min-w-40 flex-1 space-y-1.5">
                  <PixelLabel htmlFor="new-room">Room number</PixelLabel>
                  <PixelInput
                    id="new-room"
                    placeholder="e.g. 12B or 204"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    autoFocus
                  />
                </div>
                <PixelButton type="submit" disabled={addingRoom}>
                  {addingRoom ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {addingRoom ? "Adding…" : "Add to group"}
                </PixelButton>
                <PixelButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddRoom(false);
                    setNewRoomNumber("");
                  }}
                >
                  Cancel
                </PixelButton>
              </form>
              <p className="mt-2 text-[9px] font-semibold text-teal-900/40">
                Creates the room under this hostel/block. Then assign wash days
                below. Students registered into this room later share the same
                slot automatically.
              </p>
            </PixelCard>
          )}

          {groupDetailLoading && rooms.length === 0 ? (
            <PixelCard className="flex items-center justify-center gap-2 py-16 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
            </PixelCard>
          ) : rooms.length === 0 ? (
            <PixelCard className="flex flex-col items-center justify-center gap-3 py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
              <CalendarDays className="h-4 w-4" />
              <p>No rooms yet</p>
              <p className="max-w-sm font-semibold normal-case tracking-normal text-teal-900/50">
                Use <strong>Add room</strong> to type a room number, or register
                students with room numbers on the Students page.
              </p>
              <PixelButton
                size="sm"
                type="button"
                onClick={() => setShowAddRoom(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add room
              </PixelButton>
            </PixelCard>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => {
                  const days = roomDays[room.id] ?? [];
                  const roomTime = roomTimes[room.id] ?? "";
                  const effectiveRoomTime = toHHmm(roomTime || globalHandoff);
                  return (
                    <PixelCard key={room.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest">
                            Room {room.number}
                          </p>
                          <p className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                            {room.studentCount} student
                            {room.studentCount === 1 ? "" : "s"}
                            {room.students.length
                              ? ` · ${room.students
                                  .map((s) => s.firstName)
                                  .join(", ")}`
                              : ""}
                          </p>
                        </div>
                        {days.length > 0 ? (
                          <PixelBadge tone="teal">
                            {days.map((d) => DAY_SHORT[d]).join(" · ")}
                          </PixelBadge>
                        ) : (
                          <PixelBadge tone="slate">No days</PixelBadge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <PixelLabel>Washing days</PixelLabel>
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                          {DAYS.map((d) => {
                            const owner = dayUsedByRoom.get(d);
                            const takenByOtherRoom =
                              !!owner && owner.roomId !== room.id;
                            const otherMachine =
                              daysBlockedByOtherMachines.get(room.id)?.get(d) ??
                              null;
                            const selected = days.includes(d);
                            const locked =
                              takenByOtherRoom || !!otherMachine;
                            const title = selected
                              ? `${DAY_SHORT[d]} — click to remove`
                              : takenByOtherRoom
                                ? `${DAY_SHORT[d]} already used by Room ${owner!.roomNumber}`
                                : otherMachine
                                  ? `${DAY_SHORT[d]} already used by ${otherMachine} for this room`
                                  : `Assign ${DAY_SHORT[d]} to Room ${room.number}`;
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={locked}
                                aria-disabled={locked}
                                aria-pressed={selected}
                                title={title}
                                onClick={() => {
                                  if (locked) return;
                                  toggleDay(room.id, d);
                                }}
                                className={`border-2 px-1 py-2 text-[9px] font-black uppercase tracking-wide transition-colors ${
                                  selected
                                    ? "border-teal-900 bg-teal-900 text-white dark:border-teal-100 dark:bg-teal-100 dark:text-teal-950"
                                    : locked
                                      ? "pointer-events-none cursor-not-allowed border-teal-900/10 bg-teal-900/5 text-teal-900/20 line-through opacity-50 dark:border-teal-100/10 dark:bg-teal-100/5 dark:text-teal-100/20"
                                      : "cursor-pointer border-teal-900/20 text-teal-900/70 hover:border-teal-700 dark:border-teal-100/20 dark:text-teal-100/70"
                                }`}
                              >
                                {DAY_SHORT[d]}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[8px] font-semibold uppercase tracking-widest text-teal-900/35 dark:text-teal-100/35">
                          Grey / struck days are already taken
                        </p>
                      </div>

                      <div className="space-y-2">
                        <PixelLabel htmlFor={`time-${room.id}`}>
                          Handoff time (this room)
                        </PixelLabel>
                        <PixelInput
                          id={`time-${room.id}`}
                          type="time"
                          step={60}
                          value={toHHmm(roomTime || globalHandoff)}
                          onChange={(e) =>
                            setRoomTimes((prev) => ({
                              ...prev,
                              [room.id]: toHHmm(e.target.value, globalHandoff),
                            }))
                          }
                          className="max-w-40 font-mono tabular-nums"
                        />
                        <p className="text-[9px] font-semibold text-teal-900/40 dark:text-teal-100/40">
                          Defaults to {globalHandoff}; change anytime with the
                          clock.
                        </p>
                      </div>

                      {days.length > 0 && (
                        <p className="border-t-2 border-teal-900/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-teal-900/50 dark:border-teal-100/10 dark:text-teal-100/50">
                          {days.length} day{days.length === 1 ? "" : "s"} ·
                          handoff {effectiveRoomTime}
                        </p>
                      )}
                    </PixelCard>
                  );
                })}
              </div>

              {slots.length > 0 && (
                <PixelCard className="p-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                    Week schedule ({slots.length} slot
                    {slots.length === 1 ? "" : "s"})
                  </p>
                  <ol className="space-y-2">
                    {slots.map((s, i) => {
                      const r = rooms.find((x) => x.id === s.roomId);
                      return (
                        <li
                          key={`${s.dayOfWeek}-${s.roomId}-${s.startTime}`}
                          className="flex items-center justify-between border-2 border-teal-900/10 px-3 py-2 text-[11px] font-black dark:border-teal-100/10"
                        >
                          <span>
                            {i + 1}. {s.dayOfWeek} → Room {r?.number ?? s.roomId}
                            {r?.studentCount
                              ? ` (${r.studentCount} student${r.studentCount === 1 ? "" : "s"})`
                              : ""}
                          </span>
                          <span className="font-mono text-[10px] font-bold tabular-nums text-teal-900/50 dark:text-teal-100/50">
                            {s.startTime}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </PixelCard>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
