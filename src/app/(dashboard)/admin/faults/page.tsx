"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Wrench } from "lucide-react";
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
  PixelTextarea,
  PixelTh,
  SectionTitle,
} from "@/components/pixel/pixel-ui";
import { api, useApi, ApiError } from "@/lib/api/client";
import type { FaultDTO, MachineDTO } from "@/lib/types/client";

type FaultSeverity = FaultDTO["severity"];
type FaultStatus = FaultDTO["status"];

const severityTone: Record<FaultSeverity, "teal" | "amber" | "red"> = {
  LOW: "teal",
  MEDIUM: "amber",
  HIGH: "red",
  CRITICAL: "red",
};

const statusTone: Record<FaultStatus, "slate" | "amber" | "green" | "red"> = {
  REPORTED: "slate",
  ACKNOWLEDGED: "slate",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
  CLOSED: "green",
  WONT_FIX: "red",
};

const statusLabel: Record<FaultStatus, string> = {
  REPORTED: "Reported",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  WONT_FIX: "Won't fix",
};

function machineLabel(f: FaultDTO) {
  return (
    f.machine?.code ||
    f.machine?.name ||
    f.machine?.serialNumber ||
    f.machineId.slice(0, 8)
  );
}

function reporterLabel(f: FaultDTO) {
  const name = f.reportedBy
    ? `${f.reportedBy.firstName} ${f.reportedBy.lastName}`
    : "Unknown";
  const room =
    f.reportedBy?.roomNumber ||
    f.reportedBy?.room?.number ||
    null;
  return room ? `${name} (Room ${room})` : name;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function costLabel(f: FaultDTO) {
  const c = f.actualCost ?? f.estimatedCost;
  if (c == null || c === "") return "—";
  const n = Number(c);
  return Number.isFinite(n) ? `GHS ${n.toFixed(2)}` : String(c);
}

export default function AdminFaults() {
  const { data: faults, reload, error, loading: isLoading } = useApi<FaultDTO[]>(
    "/api/v1/faults?limit=100"
  );
  const { data: machines } = useApi<MachineDTO[]>("/api/v1/machines?limit=100");

  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [selectedFault, setSelectedFault] = useState<FaultDTO | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [saving, setSaving] = useState(false);

  const list = faults ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return list;
    if (statusFilter === "open") {
      return list.filter(
        (f) =>
          f.status === "REPORTED" ||
          f.status === "ACKNOWLEDGED" ||
          f.status === "IN_PROGRESS"
      );
    }
    if (statusFilter === "done") {
      return list.filter(
        (f) =>
          f.status === "RESOLVED" ||
          f.status === "CLOSED" ||
          f.status === "WONT_FIX"
      );
    }
    return list.filter((f) => f.status === statusFilter);
  }, [list, statusFilter]);

  const openCount = list.filter(
    (f) =>
      f.status === "REPORTED" ||
      f.status === "ACKNOWLEDGED" ||
      f.status === "IN_PROGRESS"
  ).length;

  const faultyMachines = useMemo(() => {
    return (machines ?? []).filter(
      (m) => m.status === "FAULTY" || m.status === "MAINTENANCE"
    );
  }, [machines]);

  const setStatus = async (id: string, status: FaultStatus) => {
    try {
      await api.patch(`/api/v1/faults/${id}`, { status });
      toast.success(
        status === "IN_PROGRESS"
          ? "Ticket marked in progress."
          : status === "ACKNOWLEDGED"
            ? "Ticket acknowledged."
            : `Status → ${statusLabel[status]}`
      );
      reload();
    } catch (e) {
      toast.error((e as ApiError).message || "Could not update ticket.");
    }
  };

  const handleResolveFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFault) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/faults/${selectedFault.id}`, {
        status: "RESOLVED",
        resolution: resolutionText.trim(),
        actualCost: repairCost ? Number(repairCost) : undefined,
      });
      toast.success(
        `Fault on ${machineLabel(selectedFault)} marked resolved.`
      );
      setSelectedFault(null);
      setResolutionText("");
      setRepairCost("");
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || "Could not resolve fault.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          text="FAULTS"
          sub={`${openCount} open ticket${openCount === 1 ? "" : "s"} from students`}
        />
        <PixelSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto min-w-[10rem]"
        >
          <option value="open">Open only</option>
          <option value="all">All tickets</option>
          <option value="done">Resolved / closed</option>
          <option value="REPORTED">Reported</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </PixelSelect>
      </div>

      <div className="space-y-4">
        <SectionTitle text="TICKETS" />
        <PixelCard className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
                <PixelTh className="pt-4">Machine</PixelTh>
                <PixelTh className="pt-4">Issue</PixelTh>
                <PixelTh className="pt-4">Severity</PixelTh>
                <PixelTh className="pt-4">Reported by</PixelTh>
                <PixelTh className="pt-4">Date</PixelTh>
                <PixelTh className="pt-4">Status</PixelTh>
                <PixelTh className="pt-4 text-right">Cost</PixelTh>
                <PixelTh className="pt-4 text-right">Action</PixelTh>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40"
                  >
                    Loading tickets…
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-[11px] font-semibold text-rose-600"
                  >
                    {(error as Error).message || "Could not load faults."}
                  </td>
                </tr>
              )}
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40"
                  >
                    {list.length === 0
                      ? "No fault reports yet — students report from the app."
                      : "No tickets match this filter."}
                  </td>
                </tr>
              )}
              {filtered.map((fault) => {
                const open =
                  fault.status === "REPORTED" ||
                  fault.status === "ACKNOWLEDGED" ||
                  fault.status === "IN_PROGRESS";
                return (
                  <tr
                    key={fault.id}
                    className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5"
                  >
                    <PixelTd className="font-black">
                      {machineLabel(fault)}
                    </PixelTd>
                    <PixelTd>
                      <p className="font-black">{fault.title}</p>
                      <p className="max-w-xs truncate text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                        {fault.description}
                      </p>
                    </PixelTd>
                    <PixelTd>
                      <PixelBadge tone={severityTone[fault.severity]}>
                        {fault.severity}
                      </PixelBadge>
                    </PixelTd>
                    <PixelTd className="text-[10px] text-teal-900/60 dark:text-teal-100/60">
                      {reporterLabel(fault)}
                    </PixelTd>
                    <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                      {formatDate(fault.createdAt)}
                    </PixelTd>
                    <PixelTd>
                      <PixelBadge tone={statusTone[fault.status]}>
                        {statusLabel[fault.status]}
                      </PixelBadge>
                    </PixelTd>
                    <PixelTd className="text-right font-black">
                      {costLabel(fault)}
                    </PixelTd>
                    <PixelTd className="text-right">
                      {open && (
                        <div className="flex justify-end gap-2">
                          {fault.status === "REPORTED" && (
                            <PixelButton
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void setStatus(fault.id, "ACKNOWLEDGED")
                              }
                            >
                              Ack
                            </PixelButton>
                          )}
                          {fault.status !== "IN_PROGRESS" && (
                            <PixelButton
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void setStatus(fault.id, "IN_PROGRESS")
                              }
                            >
                              Work on
                            </PixelButton>
                          )}
                          <PixelButton
                            size="sm"
                            onClick={() => {
                              setSelectedFault(fault);
                              setResolutionText(fault.resolution || "");
                              setRepairCost(
                                fault.actualCost != null
                                  ? String(fault.actualCost)
                                  : ""
                              );
                            }}
                          >
                            Resolve
                          </PixelButton>
                        </div>
                      )}
                    </PixelTd>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PixelCard>
      </div>

      {/* Machines currently flagged FAULTY / MAINTENANCE (live data) */}
      <div className="space-y-4">
        <SectionTitle text="MACHINES NEEDING ATTENTION" />
        {faultyMachines.length === 0 ? (
          <PixelCard className="flex items-center gap-3 p-5 text-[11px] font-semibold text-teal-900/50 dark:text-teal-100/50">
            <Wrench className="h-4 w-4 shrink-0 text-teal-600" />
            No machines marked FAULTY or MAINTENANCE right now.
          </PixelCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faultyMachines.map((m) => {
              const related = list.filter(
                (f) =>
                  f.machineId === m.id &&
                  (f.status === "REPORTED" ||
                    f.status === "ACKNOWLEDGED" ||
                    f.status === "IN_PROGRESS")
              );
              return (
                <PixelCard key={m.id} bolts className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-black tracking-wide text-teal-950 dark:text-white">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {m.code || m.name || m.serialNumber}
                    </p>
                    <PixelBadge
                      tone={m.status === "FAULTY" ? "red" : "amber"}
                    >
                      {m.status}
                    </PixelBadge>
                  </div>
                  <p className="text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                    {m.hall?.name ? `${m.hall.name} · ` : ""}
                    {related.length} open ticket
                    {related.length === 1 ? "" : "s"}
                  </p>
                  {related.length > 0 && (
                    <ul className="space-y-1.5 border-t-2 border-teal-900/10 pt-2 dark:border-teal-100/10">
                      {related.slice(0, 3).map((f) => (
                        <li
                          key={f.id}
                          className="text-[11px] font-bold text-teal-900/70 dark:text-teal-100/70"
                        >
                          · {f.title}{" "}
                          <span className="font-semibold text-teal-900/40">
                            ({statusLabel[f.status]})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </PixelCard>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={selectedFault !== null}
        onOpenChange={(open) => !open && setSelectedFault(null)}
      >
        <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">
              Resolve fault ticket
            </DialogTitle>
            <DialogDescription>
              {selectedFault
                ? `${machineLabel(selectedFault)} — ${selectedFault.title}`
                : "Mark resolved and record repair costs."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResolveFault} className="space-y-4 py-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="resolution">Resolution details</PixelLabel>
              <PixelTextarea
                id="resolution"
                placeholder="Describe what was fixed..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="cost">Actual repair cost (GHS)</PixelLabel>
              <PixelInput
                id="cost"
                type="number"
                step="0.01"
                min={0}
                placeholder="150"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <PixelButton
                type="button"
                variant="outline"
                onClick={() => setSelectedFault(null)}
              >
                Cancel
              </PixelButton>
              <PixelButton type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save resolution"}
              </PixelButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
