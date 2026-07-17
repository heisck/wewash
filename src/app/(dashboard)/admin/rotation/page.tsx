"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Save } from "lucide-react";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelLabel, PixelSelect,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { MachineDTO, RoomDTO, MachineScheduleDTO } from "@/lib/types/client";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type Slot = { dayOfWeek: string; roomId: string; startTime: string; endTime: string; orderIndex: number };

export default function AdminRotationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[10px] font-black uppercase tracking-widest text-teal-900/40">Loading rotation…</div>}>
      <RotationInner />
    </Suspense>
  );
}

function RotationInner() {
  const search = useSearchParams();
  const preset = search.get("machine") ?? "";

  const { data: machines } = useApi<MachineDTO[]>("/api/v1/machines?limit=100");
  const [machineId, setMachineId] = useState(preset);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [saving, setSaving] = useState(false);
  const [handoff, setHandoff] = useState("08:00");

  const list = machines ?? [];
  const machine = list.find((m) => m.id === machineId) ?? null;

  const { data: details, reload } = useApi<MachineDTO & { schedules?: MachineScheduleDTO[] }>(
    machineId ? `/api/v1/machines/${machineId}` : null
  );

  const hallId = machine?.hallId ?? details?.hallId ?? "";
  const { data: rooms } = useApi<RoomDTO[]>(hallId ? `/api/v1/halls/${hallId}/rooms` : null);
  const roomList = rooms ?? [];

  useEffect(() => {
    if (preset) setMachineId(preset);
  }, [preset]);

  useEffect(() => {
    const schedules = details?.schedules ?? [];
    if (!schedules.length) {
      setSlots([]);
      return;
    }
    setSlots(
      schedules.map((s, i) => ({
        dayOfWeek: s.dayOfWeek,
        roomId: s.roomId,
        startTime: s.startTime || "08:00",
        endTime: s.endTime || "08:00",
        orderIndex: s.orderIndex ?? i,
      }))
    );
    if (schedules[0]?.startTime) setHandoff(schedules[0].startTime);
  }, [details]);

  const roomById = useMemo(() => {
    const m = new Map<string, RoomDTO>();
    roomList.forEach((r) => m.set(r.id, r));
    return m;
  }, [roomList]);

  const setDayRoom = (day: string, roomId: string) => {
    setSlots((prev) => {
      const without = prev.filter((s) => s.dayOfWeek !== day);
      if (!roomId) return without;
      // Remove this room from other days so one room isn't double-booked on the calendar.
      const cleaned = without.filter((s) => s.roomId !== roomId);
      const orderIndex = DAYS.indexOf(day as (typeof DAYS)[number]);
      return [
        ...cleaned,
        {
          dayOfWeek: day,
          roomId,
          startTime: handoff,
          endTime: handoff,
          orderIndex: orderIndex >= 0 ? orderIndex : cleaned.length,
        },
      ].sort((a, b) => a.orderIndex - b.orderIndex);
    });
  };

  const save = async () => {
    if (!machineId) return toast.error("Select a machine first.");
    if (slots.length === 0) return toast.error("Assign at least one room/day.");
    setSaving(true);
    try {
      await api.put(`/api/v1/machines/${machineId}`, {
        schedules: slots.map((s, i) => ({
          roomId: s.roomId,
          dayOfWeek: s.dayOfWeek,
          startTime: handoff,
          endTime: handoff,
          orderIndex: i,
        })),
      });
      toast.success("Rotation schedule saved.");
      reload();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="ROTATION"
          sub="Assign washing days per room — any number of rooms, edit anytime"
        />
        <PixelButton onClick={save} disabled={saving || !machineId}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save schedule"}
        </PixelButton>
      </div>

      <PixelCard className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <PixelLabel htmlFor="mach">Machine</PixelLabel>
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
          <PixelLabel htmlFor="handoff">Handoff time (24h window)</PixelLabel>
          <PixelSelect id="handoff" value={handoff} onChange={(e) => setHandoff(e.target.value)}>
            {["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "18:00"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </PixelSelect>
        </div>
      </PixelCard>

      {!machineId ? (
        <PixelCard className="flex items-center justify-center py-16 text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          <CalendarDays className="mr-2 h-4 w-4" /> Select a machine to edit its week calendar.
        </PixelCard>
      ) : !hallId ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          Assign this machine to a hostel first (Machines page), then add rooms.
        </PixelCard>
      ) : roomList.length === 0 ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          No rooms in this hostel yet. Add rooms under Hostels.
        </PixelCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((day) => {
            const slot = slots.find((s) => s.dayOfWeek === day);
            const room = slot ? roomById.get(slot.roomId) : null;
            return (
              <PixelCard key={day} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-widest">{day}</p>
                  {room && <PixelBadge tone="teal">Assigned</PixelBadge>}
                </div>
                <PixelSelect
                  value={slot?.roomId ?? ""}
                  onChange={(e) => setDayRoom(day, e.target.value)}
                >
                  <option value="">— no room —</option>
                  {roomList.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number}
                      {r.block ? ` · ${r.block}` : ""}
                      {r.floor != null ? ` · F${r.floor}` : ""}
                    </option>
                  ))}
                </PixelSelect>
                {room && (
                  <div className="border-t-2 border-teal-900/10 pt-2 text-[10px] font-bold uppercase tracking-widest text-teal-900/50">
                    <p>Occupants: {room.capacity}</p>
                    <p>Section: {room.section ?? "—"}</p>
                    <p>Order: {(slot?.orderIndex ?? 0) + 1}</p>
                  </div>
                )}
              </PixelCard>
            );
          })}
        </div>
      )}

      {slots.length > 0 && (
        <PixelCard className="p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
            Active rotation ({slots.length} room{slots.length === 1 ? "" : "s"})
          </p>
          <ol className="space-y-2">
            {[...slots]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((s, i) => {
                const r = roomById.get(s.roomId);
                return (
                  <li
                    key={`${s.dayOfWeek}-${s.roomId}`}
                    className="flex items-center justify-between border-2 border-teal-900/10 px-3 py-2 text-[11px] font-black dark:border-teal-100/10"
                  >
                    <span>
                      {i + 1}. {s.dayOfWeek} → Room {r?.number ?? s.roomId}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                      {handoff} · 24h
                    </span>
                  </li>
                );
              })}
          </ol>
        </PixelCard>
      )}
    </div>
  );
}
