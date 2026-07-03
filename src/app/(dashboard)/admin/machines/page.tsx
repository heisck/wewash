"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings, Plus, QrCode, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel, PixelSelect,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { MachineDTO, HallDTO } from "@/lib/types/client";

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
  const [addOpen, setAddOpen] = useState(false);
  const [configFor, setConfigFor] = useState<MachineDTO | null>(null);
  const [qrFor, setQrFor] = useState<MachineDTO | null>(null);

  const list = machines ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="MACHINES" sub="Units, status & QR tracking" />
        <PixelButton onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add machine
        </PixelButton>
      </div>

      {list.length === 0 ? (
        <PixelCard className="flex items-center justify-center py-16 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
          No machines yet — add your first unit.
        </PixelCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {list.map((m) => (
            <PixelCard key={m.id} bolts className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black tracking-wide text-teal-950 dark:text-white">{m.serialNumber}</p>
                  <p className="text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                    {[m.brand, m.model].filter(Boolean).join(" ") || "—"}
                  </p>
                </div>
                <PixelBadge tone={statusTone[m.status] ?? "slate"}>{m.status}</PixelBadge>
              </div>

              <div className="grid grid-cols-2 gap-px border-2 border-teal-900/15 bg-teal-900/15 dark:border-teal-100/15 dark:bg-teal-100/15">
                <Vital label="Hostel" value={m.hall?.code ?? "Unassigned"} highlight />
                <Vital label="Status" value={m.status} />
              </div>

              <div className="flex flex-wrap justify-end gap-2.5 border-t-2 border-teal-900/10 pt-4 dark:border-teal-100/10">
                <PixelButton size="sm" variant="ghost" onClick={() => setQrFor(m)}>
                  <QrCode className="h-3 w-3" /> QR code
                </PixelButton>
                <PixelButton size="sm" variant="outline" onClick={() => setConfigFor(m)}>
                  <Settings className="h-3 w-3" /> Configure status
                </PixelButton>
              </div>
            </PixelCard>
          ))}
        </div>
      )}

      <AddMachineDialog open={addOpen} onClose={() => setAddOpen(false)} halls={halls ?? []} onDone={reload} />
      <ConfigDialog machine={configFor} onClose={() => setConfigFor(null)} onDone={reload} />
      <QrDialog machine={qrFor} onClose={() => setQrFor(null)} />
    </div>
  );
}

function AddMachineDialog({ open, onClose, halls, onDone }: { open: boolean; onClose: () => void; halls: HallDTO[]; onDone: () => void }) {
  const [serialNumber, setSerial] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [hallId, setHallId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/v1/machines", {
        serialNumber,
        brand: brand || undefined,
        model: model || undefined,
        hallId: hallId || undefined,
      });
      toast.success(`${serialNumber} added. A QR code is now available.`);
      onDone();
      onClose();
      setSerial(""); setBrand(""); setModel(""); setHallId("");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not add machine.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Add machine</DialogTitle>
          <DialogDescription>Register a new washing machine and assign it to a hostel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <PixelLabel htmlFor="serial">Serial number</PixelLabel>
            <PixelInput id="serial" placeholder="WEWASH-W03-ATL" value={serialNumber} onChange={(e) => setSerial(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PixelLabel htmlFor="brand">Brand</PixelLabel>
              <PixelInput id="brand" placeholder="Samsung" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="model">Model</PixelLabel>
              <PixelInput id="model" placeholder="EcoBubble 9kg" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <PixelLabel htmlFor="hall">Hostel</PixelLabel>
            <PixelSelect id="hall" value={hallId} onChange={(e) => setHallId(e.target.value)}>
              <option value="">Unassigned</option>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </PixelSelect>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <PixelButton type="button" variant="outline" onClick={onClose}>Cancel</PixelButton>
            <PixelButton type="submit" disabled={saving}>{saving ? "Saving..." : "Add machine"}</PixelButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfigDialog({ machine, onClose, onDone }: { machine: MachineDTO | null; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<string>(machine?.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);

  // Keep the select in sync when a different machine is opened.
  if (machine && status !== machine.status && !saving && document.activeElement?.id !== "mstatus") {
    // no-op guard; controlled below via key
  }

  const save = async () => {
    if (!machine) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/machines/${machine.id}`, { status });
      toast.success(`${machine.serialNumber} set to ${status}.`);
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
          <DialogDescription>Update {machine?.serialNumber} availability.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <PixelLabel htmlFor="mstatus">Machine status</PixelLabel>
          <PixelSelect id="mstatus" key={machine?.id} defaultValue={machine?.status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">ACTIVE (ready for use)</option>
            <option value="MAINTENANCE">MAINTENANCE (inspection)</option>
            <option value="FAULTY">FAULTY (out of order)</option>
            <option value="INACTIVE">INACTIVE (parked)</option>
          </PixelSelect>
        </div>
        <DialogFooter className="gap-2">
          <PixelButton variant="outline" onClick={onClose}>Cancel</PixelButton>
          <PixelButton onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</PixelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrDialog({ machine, onClose }: { machine: MachineDTO | null; onClose: () => void }) {
  const qrUrl = machine ? `/api/v1/machines/${machine.id}/qr` : "";
  return (
    <Dialog open={machine !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wider">Machine QR</DialogTitle>
          <DialogDescription>Print this and stick it on {machine?.serialNumber}. Students scan it to check in.</DialogDescription>
        </DialogHeader>
        {machine && (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt={`QR code for ${machine.serialNumber}`} className="h-56 w-56 border-2 border-teal-900/20 bg-white" />
            <a href={qrUrl} download={`${machine.serialNumber}-qr.png`}>
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

function Vital({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white p-3 dark:bg-[#07201e]">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">{label}</p>
      <p className={`mt-1 truncate text-[11px] font-black ${highlight ? "text-teal-700 dark:text-teal-300" : "text-teal-950 dark:text-teal-50"}`}>
        {value}
      </p>
    </div>
  );
}
