"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Save } from "lucide-react";
import {
  PageTitle,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelInput,
  PixelLabel,
  PixelSelect,
} from "@/components/pixel/pixel-ui";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { api, useApi, ApiError } from "@/lib/api/client";
import type {
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

/** Normalize HTML time input / API values to HH:MM */
function toHHmm(value: string | undefined | null, fallback = "08:00"): string {
  if (!value) return fallback;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
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
  const preset = search.get("machine") ?? "";

  const { data: machines } = useApi<MachineDTO[]>("/api/v1/machines?limit=100");
  const { data: groups } = useApi<StudentGroupDTO[]>(
    "/api/v1/student-groups?limit=200"
  );
  const { data: contact } = useApi<ContactConfig>("/api/v1/public/contact");

  const settingsHandoff = toHHmm(contact?.rotationHandoffTime, "08:00");

  const [machineId, setMachineId] = usePersistedState(
    "admin/rotation:machineId",
    preset
  );
  const [groupId, setGroupId] = usePersistedState(
    "admin/rotation:groupId",
    ""
  );
  /** roomId → one or more washing days */
  const [roomDays, setRoomDays] = usePersistedState<Record<string, Day[]>>(
    "admin/rotation:roomDays",
    {}
  );
  /** Optional per-room handoff (HH:MM); empty = use global */
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

  const list = machines ?? [];
  const groupList = groups ?? [];

  const { data: details, reload } = useApi<
    MachineDTO & { schedules?: MachineScheduleDTO[] }
  >(machineId ? `/api/v1/machines/${machineId}` : null);

  const { data: groupDetail, reload: reloadGroup } = useApi<
    StudentGroupDTO & { rooms?: RoomRow[] }
  >(groupId ? `/api/v1/student-groups/${groupId}` : null);

  const rooms: RoomRow[] = useMemo(() => {
    const raw = groupDetail?.rooms ?? [];
    return raw.map((r) => ({
      id: r.id,
      number: r.number,
      studentCount: r.studentCount,
      students: r.students ?? [],
    }));
  }, [groupDetail]);

  useEffect(() => {
    if (preset) setMachineId(preset);
  }, [preset]);

  useEffect(() => {
    if (useSettingsHandoff && settingsHandoff) {
      setHandoff(settingsHandoff);
    }
  }, [settingsHandoff, useSettingsHandoff]);

  // When machine changes, clear draft days then hydrate from that machine's schedule only
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
    // Replace (do not merge stale prev) so used days stay accurate
    setRoomDays(daysMap);
    setRoomTimes(timesMap);

    if (schedules[0]?.startTime && !useSettingsHandoff) {
      setHandoff(toHHmm(schedules[0].startTime));
    }
  }, [machineId, details, useSettingsHandoff]);

  // Keep only rooms that belong to the selected group (preserve days for those rooms)
  useEffect(() => {
    if (!groupId) return;
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
  }, [groupId, rooms]);

  const globalHandoff = useSettingsHandoff ? settingsHandoff : toHHmm(handoff);

  /**
   * Day ownership for THIS machine draft: which room holds each weekday.
   * One machine can only be in one room per day.
   */
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

  /**
   * Days already taken on OTHER machines for rooms in this group
   * (DB rule: one room cannot have two machines the same day).
   */
  const daysBlockedByOtherMachines = useMemo(() => {
    const map = new Map<string, Map<Day, string>>(); // roomId → day → machine label
    const roomIds = new Set(rooms.map((r) => r.id));
    for (const m of list) {
      if (!machineId || m.id === machineId) continue;
      const schedules =
        m.schedules ??
        (m as { machineSchedules?: MachineScheduleDTO[] }).machineSchedules ??
        [];
      const label = m.code || m.name || m.serialNumber;
      for (const s of schedules) {
        if (!roomIds.has(s.roomId)) continue;
        if (!DAYS.includes(s.dayOfWeek as Day)) continue;
        const day = s.dayOfWeek as Day;
        if (!map.has(s.roomId)) map.set(s.roomId, new Map());
        map.get(s.roomId)!.set(day, label);
      }
    }
    return map;
  }, [list, machineId, rooms]);

  const toggleDay = (roomId: string, day: Day) => {
    const owner = dayUsedByRoom.get(day);
    // Already used by another room on this machine — hard block (do not steal)
    if (owner && owner.roomId !== roomId) return;
    // Room already has this day on another machine
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
    if (slots.length === 0)
      return toast.error("Pick at least one day for a room.");
    if (rooms.length === 0)
      return toast.error(
        "This group has no rooms yet. Register students with room numbers first."
      );

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
      });
      toast.success(
        `Rotation saved — ${slots.length} slot(s) across ${
          Object.values(roomDays).filter((d) => d.length).length
        } room(s). Students in new/changed slots get SMS.`
      );
      reload();
      reloadGroup();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const selectedGroup = groupList.find((g) => g.id === groupId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="ROTATION"
          sub="Machine + group → any days per room, any handoff time"
        />
        <PixelButton
          onClick={save}
          disabled={saving || !machineId || !groupId}
        >
          <Save className="h-3.5 w-3.5" />{" "}
          {saving ? "Saving..." : "Save schedule"}
        </PixelButton>
      </div>

      <PixelCard className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
        <div className="space-y-2">
          <PixelLabel htmlFor="mach">1. Machine</PixelLabel>
          <PixelSelect
            id="mach"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          >
            <option value="">Select machine…</option>
            {list.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code || m.name || m.serialNumber}
                {m.hall?.code ? ` · ${m.hall.code}` : ""}
              </option>
            ))}
          </PixelSelect>
        </div>

        <div className="space-y-2">
          <PixelLabel htmlFor="grp">2. Student group</PixelLabel>
          <PixelSelect
            id="grp"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">Select group (floor / block)…</option>
            {groupList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.hall?.code ?? "Hall"} · Fl. {g.floor} · Bl.{" "}
                {g.block}
                {g._count?.students != null
                  ? ` (${g._count.students} students)`
                  : ""}
              </option>
            ))}
          </PixelSelect>
          {selectedGroup && (
            <p className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
              Tick washing days per room. Days already used (this machine or
              another machine on that room) are disabled and cannot be clicked.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <PixelLabel htmlFor="handoff">3. Default handoff time</PixelLabel>
          <div className="flex flex-col gap-2">
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
            <p className="text-[10px] font-semibold text-teal-900/45 dark:text-teal-100/45">
              Global default for rooms without their own time. Each room can
              override with its own clock below.
            </p>
          </div>
        </div>
      </PixelCard>

      {!machineId || !groupId ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
          Select a machine and a student group to assign days & times by room.
        </PixelCard>
      ) : rooms.length === 0 ? (
        <PixelCard className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          <p>No rooms in this group yet.</p>
          <p className="max-w-sm font-semibold normal-case tracking-normal text-teal-900/50 dark:text-teal-100/50">
            Register students into the group with typed room numbers first
            (Students page).
          </p>
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
                        const locked = takenByOtherRoom || !!otherMachine;
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
                      {days.length} day{days.length === 1 ? "" : "s"} · handoff{" "}
                      {effectiveRoomTime}
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
    </div>
  );
}
