"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Settings, Plus, QrCode, Download, CalendarDays, UsersRound } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel, PixelSelect,
} from "@/components/pixel/pixel-ui";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { LocationFilterBar } from "@/components/admin/location-filter-bar";
import { useAdminLocationFilter } from "@/hooks/use-admin-location-filter";
import { matchMachineLocation } from "@/lib/admin/location-filter";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { MachineDTO, HallDTO, StudentGroupDTO } from "@/lib/types/client";

const statusTone: Record<string, "green" | "amber" | "red" | "slate"> = {
  ACTIVE: "green",
  MAINTENANCE: "amber",
  FAULTY: "red",
  INACTIVE: "slate",
  DECOMMISSIONED: "slate",
};

export default function AdminMachines() {
  const { data: machines, reload } = useApi<MachineDTO[]>("/api/v1/machines?limit=100");
  const { data: halls } = useApi<HallDTO[]>("/api/v1/halls?limit=100");
  const { data: groups } = useApi<StudentGroupDTO[]>(
    "/api/v1/student-groups?limit=200"
  );
  const { filter, active: filterActive } = useAdminLocationFilter();
  const [addOpen, setAddOpen] = usePersistedState("admin/machines:addOpen", false);
  const [configForId, setConfigForId] = usePersistedState<string | null>(
    "admin/machines:configForId",
    null
  );
  const [qrForId, setQrForId] = usePersistedState<string | null>(
    "admin/machines:qrForId",
    null
  );

  const list = useMemo(
    () => (machines ?? []).filter((m) => matchMachineLocation(m, filter)),
    [machines, filter]
  );
  const configFor = configForId
    ? (machines ?? []).find((m) => m.id === configForId) ?? null
    : null;
  const qrFor = qrForId
    ? (machines ?? []).find((m) => m.id === qrForId) ?? null
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="MACHINES"
          sub="Groups per machine · who has each unit · QR scan live"
        />
        <div className="flex gap-2">
          <Link href="/admin/rotation">
            <PixelButton variant="outline">
              <CalendarDays className="h-3.5 w-3.5" /> Rotation
            </PixelButton>
          </Link>
          <PixelButton onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add machine
          </PixelButton>
        </div>
      </div>

      <LocationFilterBar halls={halls} groups={groups} />

      {(machines ?? []).length === 0 ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
          No machines yet — add your first unit. You can start with any number of rooms.
        </PixelCard>
      ) : list.length === 0 ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40">
          No machines match this location filter
          {filterActive ? " — clear filters or pick another hostel/floor/block." : "."}
        </PixelCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {list.map((m) => {
            const scheduleCount = m.schedules?.length ?? 0;
            const scheduledGroups = (m.groups ?? []).filter((g) => g.scheduled);
            const otherGroups = (m.groups ?? []).filter((g) => !g.scheduled);
            return (
              <PixelCard key={m.id} bolts className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black tracking-wide text-teal-950 dark:text-white">
                      {m.code || m.name || m.serialNumber}
                    </p>
                    <p className="text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                      ID {m.serialNumber}
                      {[m.brand, m.model].filter(Boolean).length
                        ? ` · ${[m.brand, m.model].filter(Boolean).join(" ")}`
                        : ""}
                    </p>
                  </div>
                  <PixelBadge tone={statusTone[m.status] ?? "slate"}>{m.status}</PixelBadge>
                </div>

                <div className="grid grid-cols-2 gap-px border-2 border-teal-900/15 bg-teal-900/15 dark:border-teal-100/15 dark:bg-teal-100/15 sm:grid-cols-3">
                  <Vital label="Hostel" value={m.hall?.code ?? "Unassigned"} highlight />
                  <Vital label="Type" value={m.machineType ?? "—"} />
                  <Vital
                    label="Capacity"
                    value={m.capacityKg != null ? `${m.capacityKg} kg` : "—"}
                  />
                  <Vital label="Rotation rooms" value={String(scheduleCount)} />
                  <Vital label="Code" value={m.code ?? "—"} />
                  <Vital label="Name" value={m.name ?? "—"} />
                </div>

                {/* Groups this machine serves */}
                <div className="border-2 border-teal-900/10 px-3 py-3 dark:border-teal-100/10">
                  <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/45 dark:text-teal-100/45">
                    <UsersRound className="h-3 w-3" />
                    Student groups
                  </p>
                  {scheduledGroups.length === 0 && otherGroups.length === 0 ? (
                    <p className="mt-2 text-[10px] font-semibold text-teal-900/40">
                      No groups linked — assign rooms on Rotation or set a hostel.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {scheduledGroups.map((g) => (
                        <PixelBadge key={g.id} tone="teal">
                          {g.name}
                          <span className="opacity-70">
                            {" "}
                            · Fl.{g.floor} Bl.{g.block}
                          </span>
                        </PixelBadge>
                      ))}
                      {otherGroups.slice(0, 6).map((g) => (
                        <PixelBadge key={g.id} tone="slate">
                          {g.name}
                        </PixelBadge>
                      ))}
                      {otherGroups.length > 6 && (
                        <PixelBadge tone="slate">
                          +{otherGroups.length - 6} more in hostel
                        </PixelBadge>
                      )}
                    </div>
                  )}
                  {scheduledGroups.length > 0 && (
                    <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-teal-900/35">
                      Teal = rooms on this machine&apos;s schedule
                    </p>
                  )}
                </div>

                {/* Live from student QR scan */}
                <div
                  className={`border-2 px-3 py-3 ${
                    m.heldBy
                      ? "border-teal-600/40 bg-teal-600/10"
                      : "border-teal-900/10 bg-teal-600/5 dark:border-teal-100/10"
                  }`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/45 dark:text-teal-100/45">
                    Currently with
                  </p>
                  {m.heldBy ? (
                    <>
                      <p className="mt-1 text-sm font-black uppercase tracking-wide text-teal-950 dark:text-white">
                        {m.heldBy.firstName} {m.heldBy.lastName}
                      </p>
                      <p className="text-[10px] font-bold text-teal-800 dark:text-teal-200">
                        Room {m.heldBy.roomNumber}
                        <span className="text-teal-900/40 dark:text-teal-100/40">
                          {" "}
                          · {m.heldBy.universityId}
                        </span>
                      </p>
                      <p className="mt-1 text-[9px] font-semibold text-teal-900/40 dark:text-teal-100/40">
                        Scanned {new Date(m.heldBy.scannedAt).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
                      No active scan — waiting for a student to scan the QR
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2.5 border-t-2 border-teal-900/10 pt-4 dark:border-teal-100/10">
                  <PixelButton size="sm" variant="ghost" onClick={() => setQrForId(m.id)}>
                    <QrCode className="h-3 w-3" /> QR code
                  </PixelButton>
                  <Link href={`/admin/rotation?machine=${m.id}`}>
                    <PixelButton size="sm" variant="outline">
                      <CalendarDays className="h-3 w-3" /> Schedule
                    </PixelButton>
                  </Link>
                  <PixelButton size="sm" variant="outline" onClick={() => setConfigForId(m.id)}>
                    <Settings className="h-3 w-3" /> Status
                  </PixelButton>
                </div>
              </PixelCard>
            );
          })}
        </div>
      )}

      <AddMachineDialog open={addOpen} onClose={() => setAddOpen(false)} halls={halls ?? []} onDone={reload} />
      <ConfigDialog machine={configFor} onClose={() => setConfigForId(null)} onDone={reload} />
      <QrDialog machine={qrFor} onClose={() => setQrForId(null)} />
    </div>
  );
}

function AddMachineDialog({
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
  const [serialNumber, setSerial] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [capacityKg, setCapacity] = useState("");
  const [machineType, setType] = useState("");
  const [purchaseDate, setPurchase] = useState("");
  const [installationDate, setInstall] = useState("");
  const [hallId, setHallId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/v1/machines", {
        serialNumber,
        name: name || undefined,
        code: code || undefined,
        brand: brand || undefined,
        model: model || undefined,
        capacityKg: capacityKg ? Number(capacityKg) : undefined,
        machineType: machineType || undefined,
        purchaseDate: purchaseDate || undefined,
        installationDate: installationDate || undefined,
        hallId: hallId || undefined,
      });
      toast.success(`${code || serialNumber} added with QR code ready.`);
      onDone();
      onClose();
      setSerial("");
      setName("");
      setCode("");
      setBrand("");
      setModel("");
      setCapacity("");
      setType("");
      setPurchase("");
      setInstall("");
      setHallId("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not add machine.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Add machine</DialogTitle>
          <DialogDescription>
            Register a unit. Assign rooms later on the Rotation page — no minimum room count.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <PixelLabel htmlFor="serial">Machine ID / serial</PixelLabel>
              <PixelInput id="serial" value={serialNumber} onChange={(e) => setSerial(e.target.value)} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <PixelLabel htmlFor="code">Machine code</PixelLabel>
              <PixelInput id="code" placeholder="WeWash W1" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <PixelLabel htmlFor="name">Machine name</PixelLabel>
              <PixelInput id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="brand">Brand</PixelLabel>
              <PixelInput id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="model">Model</PixelLabel>
              <PixelInput id="model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="cap">Capacity (kg)</PixelLabel>
              <PixelInput id="cap" type="number" step="0.1" value={capacityKg} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="type">Machine type</PixelLabel>
              <PixelInput id="type" placeholder="Front load" value={machineType} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="pd">Purchase date</PixelLabel>
              <PixelInput id="pd" type="date" value={purchaseDate} onChange={(e) => setPurchase(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="id">Installation date</PixelLabel>
              <PixelInput id="id" type="date" value={installationDate} onChange={(e) => setInstall(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <PixelLabel htmlFor="hall">Hostel</PixelLabel>
              <PixelSelect id="hall" value={hallId} onChange={(e) => setHallId(e.target.value)}>
                <option value="">Unassigned</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </PixelSelect>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add machine"}
            </PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfigDialog({
  machine,
  onClose,
  onDone,
}: {
  machine: MachineDTO | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<string>(machine?.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!machine) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/machines/${machine.id}`, { status });
      toast.success(`${machine.code || machine.serialNumber} set to ${status}.`);
      onDone();
      onClose();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not update status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={machine !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Configure status</DialogTitle>
          <DialogDescription>
            Update {machine?.code || machine?.serialNumber} availability.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <PixelLabel htmlFor="mstatus">Machine status</PixelLabel>
          <PixelSelect
            id="mstatus"
            key={machine?.id}
            defaultValue={machine?.status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ACTIVE">ACTIVE (ready for use)</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="FAULTY">FAULTY</option>
            <option value="INACTIVE">INACTIVE</option>
          </PixelSelect>
        </div>
        <DialogFooter className="gap-2">
          <PixelButton variant="outline" onClick={onClose}>
            Cancel
          </PixelButton>
          <PixelButton onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </PixelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrDialog({ machine, onClose }: { machine: MachineDTO | null; onClose: () => void }) {
  const qrUrl = machine ? `/api/v1/machines/${machine.id}/qr` : "";
  const label = machine?.code || machine?.name || machine?.serialNumber;
  const appBase =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  // QR image encodes NEXT_PUBLIC_APP_URL/scan/{token}; show that path for printing.
  const opensPath = "/scan/…";

  return (
    <Dialog open={machine !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">
            Machine QR · {label}
          </DialogTitle>
          <DialogDescription>
            Print and stick on the machine. Scan opens the WeWash site, shows this unit, and
            records which student (and room) has it.
          </DialogDescription>
        </DialogHeader>
        {machine && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-full border-2 border-teal-900/15 bg-teal-600/5 p-3 text-center dark:border-teal-100/15">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/40">
                Machine
              </p>
              <p className="text-base font-black uppercase text-teal-950 dark:text-white">
                {label}
              </p>
              {machine.serialNumber && machine.serialNumber !== label && (
                <p className="font-mono text-[10px] text-teal-900/50">{machine.serialNumber}</p>
              )}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt={`QR code for ${label}`}
              className="h-56 w-56 border-2 border-teal-900/20 bg-white"
            />
            <p className="max-w-xs text-center text-[10px] font-semibold leading-relaxed text-teal-900/55 dark:text-teal-100/55">
              Opens your WeWash website
              {appBase ? (
                <>
                  {" "}
                  (<span className="font-mono text-[9px]">{appBase}{opensPath}</span>)
                </>
              ) : null}
              . Set <span className="font-mono">NEXT_PUBLIC_APP_URL</span> in production so the
              printed code never points at localhost.
            </p>
            <a href={qrUrl} download={`${label}-qr.png`}>
              <PixelButton size="sm" variant="outline">
                <Download className="h-3 w-3" /> Download PNG
              </PixelButton>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Vital({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white p-3 dark:bg-[#07201e]">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-[11px] font-black ${
          highlight ? "text-teal-700 dark:text-teal-300" : "text-teal-950 dark:text-teal-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
