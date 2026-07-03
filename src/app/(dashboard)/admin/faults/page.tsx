"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckSquare } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel,
  PixelTd, PixelTextarea, PixelTh, SectionTitle,
} from "@/components/pixel/pixel-ui";

type FaultSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type FaultStatus = "REPORTED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";

type Fault = {
  id: string;
  machineSerial: string;
  title: string;
  description: string;
  severity: FaultSeverity;
  status: FaultStatus;
  reportedBy: string;
  date: string;
  cost?: number;
};

const initialFaults: Fault[] = [
  {
    id: "f1",
    machineSerial: "WEWASH-W02-ATL",
    title: "Strange noise during spin cycle",
    description: "The machine vibrates excessively and makes a loud clanking noise when spinning clothes at high speed.",
    severity: "MEDIUM",
    status: "ACKNOWLEDGED",
    reportedBy: "Sarah Mensah (Room 102)",
    date: "Yesterday",
  },
  {
    id: "f2",
    machineSerial: "WEWASH-W01-ATL",
    title: "Drain pump block",
    description: "Water does not drain from the drum at the end of the program cycle. Drum remains filled with water.",
    severity: "HIGH",
    status: "RESOLVED",
    reportedBy: "John Doe (Room 101)",
    date: "3 days ago",
    cost: 150.0,
  },
];

const severityTone: Record<FaultSeverity, "teal" | "amber" | "red"> = {
  LOW: "teal",
  MEDIUM: "amber",
  HIGH: "red",
  CRITICAL: "red",
};

const statusTone: Record<FaultStatus, "slate" | "amber" | "green"> = {
  REPORTED: "slate",
  ACKNOWLEDGED: "slate",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
};

const statusLabel: Record<FaultStatus, string> = {
  REPORTED: "Reported",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export default function AdminFaults() {
  const [faults, setFaults] = useState<Fault[]>(initialFaults);
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [repairCost, setRepairCost] = useState("");

  const handleResolveFault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFault) return;

    setFaults(
      faults.map((f) =>
        f.id === selectedFault.id
          ? { ...f, status: "RESOLVED", cost: parseFloat(repairCost) || 0 }
          : f
      )
    );

    toast.success(`Fault on ${selectedFault.machineSerial} marked resolved.`);
    setSelectedFault(null);
    setResolutionText("");
    setRepairCost("");
  };

  const handleAcknowledge = (id: string) => {
    setFaults(faults.map((f) => (f.id === id ? { ...f, status: "IN_PROGRESS" } : f)));
    toast.info("Ticket moved to In Progress.");
  };

  return (
    <div className="space-y-8">
      <PageTitle text="FAULTS" sub="Breakdown tickets & weekly inspections" />

      {/* Active tickets */}
      <div className="space-y-4">
        <SectionTitle text="ACTIVE TICKETS" />
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
              {faults.map((fault) => (
                <tr
                  key={fault.id}
                  className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5"
                >
                  <PixelTd className="font-black">{fault.machineSerial}</PixelTd>
                  <PixelTd>
                    <p className="font-black">{fault.title}</p>
                    <p className="max-w-xs truncate text-[10px] font-semibold text-teal-900/50 dark:text-teal-100/50">
                      {fault.description}
                    </p>
                  </PixelTd>
                  <PixelTd>
                    <PixelBadge tone={severityTone[fault.severity]}>{fault.severity}</PixelBadge>
                  </PixelTd>
                  <PixelTd className="text-[10px] text-teal-900/60 dark:text-teal-100/60">
                    {fault.reportedBy}
                  </PixelTd>
                  <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                    {fault.date}
                  </PixelTd>
                  <PixelTd>
                    <PixelBadge tone={statusTone[fault.status]}>
                      {statusLabel[fault.status]}
                    </PixelBadge>
                  </PixelTd>
                  <PixelTd className="text-right font-black">
                    {fault.cost ? `GHS ${fault.cost.toFixed(2)}` : "—"}
                  </PixelTd>
                  <PixelTd className="text-right">
                    {fault.status !== "RESOLVED" && (
                      <div className="flex justify-end gap-2">
                        <PixelButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(fault.id)}
                          disabled={fault.status === "IN_PROGRESS"}
                        >
                          Work on
                        </PixelButton>
                        <PixelButton size="sm" onClick={() => setSelectedFault(fault)}>
                          Resolve
                        </PixelButton>
                      </div>
                    )}
                  </PixelTd>
                </tr>
              ))}
            </tbody>
          </table>
        </PixelCard>
      </div>

      {/* Weekly inspections */}
      <div className="space-y-4">
        <SectionTitle text="WEEKLY INSPECTIONS" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InspectionCard
            machine="WEWASH-W01-ATL"
            badge={<PixelBadge tone="green">Checked Oct 24</PixelBadge>}
            items={[
              { ok: "ok", text: "Hoses and tap seals tight, no leakage" },
              { ok: "ok", text: "Movable stand lockable wheels functional" },
              { ok: "ok", text: "Door seals cleaned and checked for mold" },
              { ok: "ok", text: "Running test programs successfully completed" },
            ]}
          />
          <InspectionCard
            machine="WEWASH-W02-ATL"
            badge={<PixelBadge tone="amber">Pending Oct 31</PixelBadge>}
            items={[
              { ok: "ok", text: "Hoses and tap seals tight, no leakage" },
              { ok: "warn", text: "Check stand stability legs (Vibration report active)" },
              { ok: "ok", text: "Door seals cleaned and checked for mold" },
              { ok: "todo", text: "Running test programs" },
            ]}
          />
        </div>
      </div>

      {/* Resolve dialog */}
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
              Mark the machine fault resolved and record repair costs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResolveFault} className="space-y-4 py-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="resolution">Resolution details</PixelLabel>
              <PixelTextarea
                id="resolution"
                placeholder="Describe what was fixed (e.g., cleared debris, replaced seal, adjusted bases)..."
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
                placeholder="150"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <PixelButton type="button" variant="outline" onClick={() => setSelectedFault(null)}>
                Cancel
              </PixelButton>
              <PixelButton type="submit">Save resolution</PixelButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InspectionCard({
  machine,
  badge,
  items,
}: {
  machine: string;
  badge: React.ReactNode;
  items: { ok: "ok" | "warn" | "todo"; text: string }[];
}) {
  return (
    <PixelCard bolts className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-black tracking-wide text-teal-950 dark:text-white">
          <CheckSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          {machine}
        </p>
        {badge}
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold text-teal-900/70 dark:text-teal-100/70">
            <span
              className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[8px] font-black ${
                item.ok === "ok"
                  ? "bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950"
                  : item.ok === "warn"
                    ? "bg-amber-500 text-amber-950"
                    : "border border-teal-900/30 text-teal-900/40 dark:border-teal-100/30 dark:text-teal-100/40"
              }`}
            >
              {item.ok === "ok" ? "✓" : item.ok === "warn" ? "!" : "?"}
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </PixelCard>
  );
}
