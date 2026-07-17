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
  PixelLabel,
  PixelSelect,
} from "@/components/pixel/pixel-ui";
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

type Day = (typeof DAYS)[number];

type RoomRow = {
  id: string;
  number: string;
  studentCount: number;
  students: { firstName: string; lastName: string }[];
};

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

  const settingsHandoff = contact?.rotationHandoffTime || "08:00";

  const [machineId, setMachineId] = useState(preset);
  const [groupId, setGroupId] = useState("");
  const [roomDay, setRoomDay] = useState<Record<string, Day | "">>({});
  const [handoff, setHandoff] = useState(settingsHandoff);
  const [useSettingsHandoff, setUseSettingsHandoff] = useState(true);
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

  // Load default handoff from settings when available
  useEffect(() => {
    if (useSettingsHandoff && settingsHandoff) {
      setHandoff(settingsHandoff);
    }
  }, [settingsHandoff, useSettingsHandoff]);

  // When machine schedules load, map existing room→day; prefer group rooms if selected
  useEffect(() => {
    const schedules = details?.schedules ?? [];
    if (!schedules.length) return;
    const map: Record<string, Day | ""> = {};
    for (const s of schedules) {
      if (DAYS.includes(s.dayOfWeek as Day)) {
        map[s.roomId] = s.dayOfWeek as Day;
      }
    }
    setRoomDay((prev) => ({ ...map, ...prev }));
    if (schedules[0]?.startTime && !useSettingsHandoff) {
      setHandoff(schedules[0].startTime);
    }
  }, [details, useSettingsHandoff]);

  // Reset day picks when group changes (keep days that still match room ids)
  useEffect(() => {
    if (!groupId) {
      setRoomDay({});
      return;
    }
    setRoomDay((prev) => {
      const next: Record<string, Day | ""> = {};
      for (const r of rooms) {
        next[r.id] = prev[r.id] ?? "";
      }
      return next;
    });
  }, [groupId, rooms]);

  const dayUsedBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const [roomId, day] of Object.entries(roomDay)) {
      if (day) map.set(day, roomId);
    }
    return map;
  }, [roomDay]);

  const assignDay = (roomId: string, day: Day | "") => {
    setRoomDay((prev) => {
      const next = { ...prev };
      // Clear this day from any other room
      if (day) {
        for (const [rid, d] of Object.entries(next)) {
          if (d === day && rid !== roomId) next[rid] = "";
        }
      }
      next[roomId] = day;
      return next;
    });
  };

  const effectiveHandoff = useSettingsHandoff ? settingsHandoff : handoff;

  const slots = useMemo(() => {
    return Object.entries(roomDay)
      .filter(([, day]) => !!day)
      .map(([roomId, day]) => ({
        roomId,
        dayOfWeek: day as Day,
        orderIndex: DAYS.indexOf(day as Day),
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [roomDay]);

  const save = async () => {
    if (!machineId) return toast.error("Select a machine first.");
    if (!groupId) return toast.error("Select a student group first.");
    if (slots.length === 0)
      return toast.error("Assign at least one room to a day of the week.");
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
          startTime: effectiveHandoff,
          endTime: effectiveHandoff,
          orderIndex: i,
        })),
      });
      toast.success(
        `Rotation saved — ${slots.length} room(s), handoff ${effectiveHandoff} daily.`
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
          sub="Machine + student group → assign washing day per room"
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
              Days are assigned by room (shared room = one day for everyone in
              it).
            </p>
          )}
        </div>

        <div className="space-y-2">
          <PixelLabel htmlFor="handoff">3. Handoff time (all rooms)</PixelLabel>
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
              <PixelSelect
                id="handoff"
                value={handoff}
                onChange={(e) => setHandoff(e.target.value)}
              >
                {[
                  "06:00",
                  "07:00",
                  "08:00",
                  "09:00",
                  "10:00",
                  "12:00",
                  "14:00",
                  "16:00",
                  "18:00",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </PixelSelect>
            )}
            <p className="text-[10px] font-semibold text-teal-900/45 dark:text-teal-100/45">
              One handoff time for every room — window is ~24h until the next
              room&apos;s day at the same time.
            </p>
          </div>
        </div>
      </PixelCard>

      {!machineId || !groupId ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
          Select a machine and a student group to assign washing days by room.
        </PixelCard>
      ) : rooms.length === 0 ? (
        <PixelCard className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          <p>No rooms in this group yet.</p>
          <p className="max-w-sm font-semibold normal-case tracking-normal text-teal-900/50 dark:text-teal-100/50">
            Register students into the group with typed room numbers first
            (Students page). Rooms are created from those numbers.
          </p>
        </PixelCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const day = roomDay[room.id] ?? "";
              return (
                <PixelCard key={room.id} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
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
                    {day ? (
                      <PixelBadge tone="teal">{day.slice(0, 3)}</PixelBadge>
                    ) : (
                      <PixelBadge tone="slate">Unset</PixelBadge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <PixelLabel htmlFor={`day-${room.id}`}>
                      Washing day
                    </PixelLabel>
                    <PixelSelect
                      id={`day-${room.id}`}
                      value={day}
                      onChange={(e) =>
                        assignDay(room.id, e.target.value as Day | "")
                      }
                    >
                      <option value="">— no day —</option>
                      {DAYS.map((d) => {
                        const takenBy = dayUsedBy.get(d);
                        const disabled = !!takenBy && takenBy !== room.id;
                        return (
                          <option key={d} value={d} disabled={disabled}>
                            {d}
                            {disabled ? " (taken)" : ""}
                          </option>
                        );
                      })}
                    </PixelSelect>
                  </div>
                  {day && (
                    <p className="border-t-2 border-teal-900/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-teal-900/50 dark:border-teal-100/10 dark:text-teal-100/50">
                      Handoff {effectiveHandoff} · ~24h for this room
                    </p>
                  )}
                </PixelCard>
              );
            })}
          </div>

          {slots.length > 0 && (
            <PixelCard className="p-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                Week order ({slots.length} room
                {slots.length === 1 ? "" : "s"} · handoff {effectiveHandoff})
              </p>
              <ol className="space-y-2">
                {slots.map((s, i) => {
                  const r = rooms.find((x) => x.id === s.roomId);
                  return (
                    <li
                      key={`${s.dayOfWeek}-${s.roomId}`}
                      className="flex items-center justify-between border-2 border-teal-900/10 px-3 py-2 text-[11px] font-black dark:border-teal-100/10"
                    >
                      <span>
                        {i + 1}. {s.dayOfWeek} → Room {r?.number ?? s.roomId}
                        {r?.studentCount
                          ? ` (${r.studentCount} student${r.studentCount === 1 ? "" : "s"})`
                          : ""}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                        {effectiveHandoff}
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
