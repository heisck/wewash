"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Settings, ArrowLeftRight, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelLabel, PixelSelect,
  PixelTd, PixelTh, SectionTitle,
} from "@/components/pixel/pixel-ui";

type MachineStatus = "ACTIVE" | "MAINTENANCE" | "FAULTY";

type Machine = {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  status: MachineStatus;
  currentRoom: string;
  rotationSchedule: { day: string; room: string }[];
  baseChecked: boolean;
  hoseChecked: boolean;
};

const initialMachines: Machine[] = [
  {
    id: "m1",
    serialNumber: "WEWASH-W01-ATL",
    brand: "Samsung",
    model: "EcoBubble 9kg Front Load",
    status: "ACTIVE",
    currentRoom: "Room 102",
    rotationSchedule: [
      { day: "Sunday", room: "Room 101" },
      { day: "Monday", room: "Room 102" },
      { day: "Tuesday", room: "Room 103" },
      { day: "Wednesday", room: "Room 104" },
      { day: "Thursday", room: "Room 105" },
      { day: "Friday", room: "Room 106" },
      { day: "Saturday", room: "Room 107" },
    ],
    baseChecked: true,
    hoseChecked: true,
  },
  {
    id: "m2",
    serialNumber: "WEWASH-W02-ATL",
    brand: "LG",
    model: "AI DD 8.5kg Front Load",
    status: "ACTIVE",
    currentRoom: "Room 203",
    rotationSchedule: [
      { day: "Sunday", room: "Room 201" },
      { day: "Monday", room: "Room 202" },
      { day: "Tuesday", room: "Room 203" },
      { day: "Wednesday", room: "Room 204" },
      { day: "Thursday", room: "Room 205" },
      { day: "Friday", room: "Room 206" },
      { day: "Saturday", room: "Room 207" },
    ],
    baseChecked: true,
    hoseChecked: false, // hose check alert
  },
];

const rotationLogs = [
  { time: "Today, 8:00 PM", machine: "WEWASH-W01-ATL", action: "Scheduled Rotation", from: "Room 101", to: "Room 102", status: "Success" },
  { time: "Yesterday, 8:00 PM", machine: "WEWASH-W02-ATL", action: "Scheduled Rotation", from: "Room 202", to: "Room 203", status: "Success" },
  { time: "2 days ago, 8:05 PM", machine: "WEWASH-W01-ATL", action: "Forced Manual Transfer", from: "Room 107", to: "Room 101", status: "Manual Override" },
];

const statusTone: Record<MachineStatus, "green" | "amber" | "red"> = {
  ACTIVE: "green",
  MAINTENANCE: "amber",
  FAULTY: "red",
};

export default function AdminMachines() {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [newStatus, setNewStatus] = useState<MachineStatus>("ACTIVE");

  const handleUpdateStatus = (id: string, status: MachineStatus) => {
    setMachines(machines.map((m) => (m.id === id ? { ...m, status } : m)));
    toast.success(`Machine status set to ${status}.`);
  };

  const handleForceTransfer = (machine: Machine) => {
    const nextRoomIndex =
      (machine.rotationSchedule.findIndex((s) => s.room === machine.currentRoom) + 1) % 7;
    const nextRoom = machine.rotationSchedule[nextRoomIndex].room;
    setMachines(
      machines.map((m) => (m.id === machine.id ? { ...m, currentRoom: nextRoom } : m))
    );
    toast.success(`${machine.serialNumber} transferred to ${nextRoom}.`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="MACHINES" sub="Physical units, rotations & checkup logs" />
        <PixelButton onClick={() => toast.info("Machine registration form coming soon.")}>
          <Plus className="h-3.5 w-3.5" /> Add machine
        </PixelButton>
      </div>

      {/* Machine cards */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {machines.map((machine) => (
          <PixelCard key={machine.id} bolts className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black tracking-wide text-teal-950 dark:text-white">
                  {machine.serialNumber}
                </p>
                <p className="text-[10px] font-bold text-teal-900/50 dark:text-teal-100/50">
                  {machine.brand} {machine.model}
                </p>
              </div>
              <PixelBadge tone={statusTone[machine.status]}>{machine.status}</PixelBadge>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-2 gap-px border-2 border-teal-900/15 bg-teal-900/15 dark:border-teal-100/15 dark:bg-teal-100/15">
              <Vital label="Current location" value={machine.currentRoom} highlight />
              <Vital
                label="Rotation group"
                value={`ATL Floor ${machine.serialNumber.includes("W01") ? "1" : "2"}`}
              />
              <Vital
                label="Movable base"
                value={machine.baseChecked ? "Stabilized ✓" : "Needs check !"}
                tone={machine.baseChecked ? "ok" : "bad"}
              />
              <Vital
                label="Hose connection"
                value={machine.hoseChecked ? "Intact ✓" : "Verify tap seal !"}
                tone={machine.hoseChecked ? "ok" : "warn"}
              />
            </div>

            {/* Rotation strip */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-teal-900/50 dark:text-teal-100/50">
                <Calendar className="h-3 w-3" />
                Weekly rotation - 8:00 PM transfer
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {machine.rotationSchedule.map((sched) => {
                  const isToday = sched.room === machine.currentRoom;
                  return (
                    <div
                      key={sched.day}
                      className={`flex flex-col items-center gap-1 border-2 px-0.5 py-1.5 text-center transition-colors ${
                        isToday
                          ? "border-teal-950/70 bg-teal-600 text-white shadow-pixel-sm dark:border-teal-100/50 dark:bg-teal-500 dark:text-teal-950"
                          : "border-teal-900/15 bg-teal-900/5 text-teal-900/50 dark:border-teal-100/15 dark:bg-teal-100/5 dark:text-teal-100/50"
                      }`}
                    >
                      <span className="text-[8px] font-black uppercase tracking-wider">
                        {sched.day.substring(0, 3)}
                      </span>
                      <span className="text-[9px] font-black">
                        {sched.room.replace("Room ", "")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2.5 border-t-2 border-teal-900/10 pt-4 dark:border-teal-100/10">
              <PixelButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedMachine(machine);
                  setNewStatus(machine.status);
                }}
              >
                <Settings className="h-3 w-3" /> Configure status
              </PixelButton>
              <PixelButton size="sm" variant="dark" onClick={() => handleForceTransfer(machine)}>
                <ArrowLeftRight className="h-3 w-3" /> Force transfer
              </PixelButton>
            </div>
          </PixelCard>
        ))}
      </div>

      {/* Rotation logs */}
      <div className="space-y-4">
        <SectionTitle text="ROTATION ACTIVITY LOGS" />
        <PixelCard className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
                <PixelTh className="pt-4">Timestamp</PixelTh>
                <PixelTh className="pt-4">Machine</PixelTh>
                <PixelTh className="pt-4">Action</PixelTh>
                <PixelTh className="pt-4">From</PixelTh>
                <PixelTh className="pt-4">To</PixelTh>
                <PixelTh className="pt-4">Status</PixelTh>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
              {rotationLogs.map((log, i) => (
                <tr key={i} className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5">
                  <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                    {log.time}
                  </PixelTd>
                  <PixelTd className="font-black">{log.machine}</PixelTd>
                  <PixelTd>{log.action}</PixelTd>
                  <PixelTd className="text-teal-900/60 dark:text-teal-100/60">{log.from}</PixelTd>
                  <PixelTd className="font-black text-teal-700 dark:text-teal-300">{log.to}</PixelTd>
                  <PixelTd>
                    <PixelBadge tone={log.status === "Success" ? "green" : "amber"}>
                      {log.status}
                    </PixelBadge>
                  </PixelTd>
                </tr>
              ))}
            </tbody>
          </table>
        </PixelCard>
      </div>

      {/* Configure status dialog */}
      <Dialog
        open={selectedMachine !== null}
        onOpenChange={(open) => !open && setSelectedMachine(null)}
      >
        <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">
              Configure machine status
            </DialogTitle>
            <DialogDescription>
              Update {selectedMachine?.serialNumber} availability for WeWash students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <PixelLabel htmlFor="status">Machine status</PixelLabel>
            <PixelSelect
              id="status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MachineStatus)}
            >
              <option value="ACTIVE">ACTIVE (Ready for Student Use)</option>
              <option value="MAINTENANCE">MAINTENANCE (Scheduled Inspection)</option>
              <option value="FAULTY">FAULTY (Out of order/needs repair)</option>
            </PixelSelect>
          </div>
          <DialogFooter className="gap-2">
            <PixelButton variant="outline" onClick={() => setSelectedMachine(null)}>
              Cancel
            </PixelButton>
            <PixelButton
              onClick={() => {
                if (selectedMachine) handleUpdateStatus(selectedMachine.id, newStatus);
                setSelectedMachine(null);
              }}
            >
              Save changes
            </PixelButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Vital({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "ok" | "warn" | "bad";
}) {
  const valueClass = highlight
    ? "text-teal-700 dark:text-teal-300"
    : tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "text-rose-600 dark:text-rose-400"
          : "text-teal-950 dark:text-teal-50";
  return (
    <div className="bg-white p-3 dark:bg-[#07201e]">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-teal-900/40 dark:text-teal-100/40">
        {label}
      </p>
      <p className={`mt-1 truncate text-[11px] font-black ${valueClass}`}>{value}</p>
    </div>
  );
}
