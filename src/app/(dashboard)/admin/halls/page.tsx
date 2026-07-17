"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Building2, DoorOpen } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel,
} from "@/components/pixel/pixel-ui";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { HallDTO, RoomDTO } from "@/lib/types/client";

export default function AdminHallsPage() {
  const { data: halls, reload } = useApi<HallDTO[]>("/api/v1/halls?limit=100");
  const [hallOpen, setHallOpen] = usePersistedState("admin/halls:hallOpen", false);
  const [roomForId, setRoomForId] = usePersistedState<string | null>(
    "admin/halls:roomForId",
    null
  );
  const [selectedId, setSelectedId] = usePersistedState<string | null>(
    "admin/halls:selectedId",
    null
  );

  const list = halls ?? [];
  const selected = selectedId
    ? list.find((h) => h.id === selectedId) ?? null
    : null;
  const roomFor = roomForId
    ? list.find((h) => h.id === roomForId) ?? null
    : null;
  const { data: rooms, reload: reloadRooms } = useApi<RoomDTO[]>(
    selected ? `/api/v1/halls/${selected.id}/rooms` : null
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="HOSTELS" sub="Halls, blocks, floors & rooms — fully admin-configured" />
        <PixelButton onClick={() => setHallOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add hostel
        </PixelButton>
      </div>

      {list.length === 0 ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          No hostels yet — add your first hall to start assigning rooms and machines.
        </PixelCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            {list.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={`w-full border-2 p-4 text-left transition-colors ${
                  selected?.id === h.id
                    ? "border-teal-700 bg-teal-600/10 dark:border-teal-300"
                    : "border-teal-900/15 bg-white hover:border-teal-700/30 dark:border-teal-100/15 dark:bg-teal-950/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    <div>
                      <p className="text-sm font-black tracking-wide">{h.name}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-teal-900/40">
                        {h.code}
                        {h.location ? ` · ${h.location}` : ""}
                      </p>
                    </div>
                  </div>
                  <PixelBadge tone={h.isActive ? "green" : "slate"}>
                    {h.isActive ? "Active" : "Inactive"}
                  </PixelBadge>
                </div>
              </button>
            ))}
          </div>

          <PixelCard className="flex flex-col gap-4 p-5 lg:col-span-7">
            {!selected ? (
              <Empty text="Select a hostel to manage its rooms." />
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                      Rooms in
                    </p>
                    <p className="text-lg font-black">{selected.name}</p>
                  </div>
                  <PixelButton size="sm" onClick={() => selected && setRoomForId(selected.id)}>
                    <Plus className="h-3 w-3" /> Add room
                  </PixelButton>
                </div>
                {(rooms ?? []).length === 0 ? (
                  <Empty text="No rooms yet. Add rooms with any block/floor/section." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                      <thead>
                        <tr className="border-b-2 border-teal-900/15 text-[9px] font-black uppercase tracking-widest text-teal-900/40">
                          <th className="py-2 pr-3">Room</th>
                          <th className="py-2 pr-3">Block</th>
                          <th className="py-2 pr-3">Floor</th>
                          <th className="py-2 pr-3">Section</th>
                          <th className="py-2">Occupants</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-teal-900/5">
                        {(rooms ?? []).map((r) => (
                          <tr key={r.id}>
                            <td className="py-2.5 pr-3 text-[12px] font-black">{r.number}</td>
                            <td className="py-2.5 pr-3 text-[11px] font-bold text-teal-900/60">
                              {r.block ?? "—"}
                            </td>
                            <td className="py-2.5 pr-3 text-[11px] font-bold text-teal-900/60">
                              {r.floor ?? "—"}
                            </td>
                            <td className="py-2.5 pr-3 text-[11px] font-bold text-teal-900/60">
                              {r.section ?? "—"}
                            </td>
                            <td className="py-2.5 text-[11px] font-bold">{r.capacity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </PixelCard>
        </div>
      )}

      <AddHallDialog
        open={hallOpen}
        onClose={() => setHallOpen(false)}
        onDone={() => {
          reload();
          setHallOpen(false);
        }}
      />
      <AddRoomDialog
        hall={roomFor}
        onClose={() => setRoomForId(null)}
        onDone={() => {
          reloadRooms();
          setRoomForId(null);
        }}
      />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center border-2 border-dashed border-teal-900/20 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-teal-900/40">
      <DoorOpen className="mr-2 h-4 w-4" /> {text}
    </div>
  );
}

function AddHallDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/v1/halls", {
        name,
        code: code.toUpperCase(),
        location: location || undefined,
      });
      toast.success(`${name} created.`);
      setName("");
      setCode("");
      setLocation("");
      onDone();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not create hostel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Add hostel</DialogTitle>
          <DialogDescription>Register a hostel / hall. No sample data is preloaded.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="hname">Hostel name</PixelLabel>
            <PixelInput id="hname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="hcode">Code</PixelLabel>
            <PixelInput
              id="hcode"
              placeholder="ATL"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="hloc">Location (optional)</PixelLabel>
            <PixelInput id="hloc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create hostel"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddRoomDialog({
  hall,
  onClose,
  onDone,
}: {
  hall: HallDTO | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [number, setNumber] = useState("");
  const [block, setBlock] = useState("");
  const [floor, setFloor] = useState("");
  const [section, setSection] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hall) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/halls/${hall.id}/rooms`, {
        hallId: hall.id,
        number,
        block: block || undefined,
        floor: floor ? Number(floor) : undefined,
        section: section || undefined,
        capacity: Number(capacity) || 1,
      });
      toast.success(`Room ${number} added.`);
      setNumber("");
      setBlock("");
      setFloor("");
      setSection("");
      setCapacity("2");
      onDone();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not add room.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={hall !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Add room</DialogTitle>
          <DialogDescription>
            Configure a room in {hall?.name}. Occupants can be edited later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="rnum">Room number</PixelLabel>
              <PixelInput id="rnum" value={number} onChange={(e) => setNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="rblock">Block</PixelLabel>
              <PixelInput id="rblock" value={block} onChange={(e) => setBlock(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="rfloor">Floor</PixelLabel>
              <PixelInput
                id="rfloor"
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="rsec">Section</PixelLabel>
              <PixelInput id="rsec" value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="rcap">Number of occupants</PixelLabel>
            <PixelInput
              id="rcap"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add room"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
