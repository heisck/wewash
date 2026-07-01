"use client";

import { useState } from "react";
import { Activity, Calendar, Wrench, Settings, ArrowLeftRight, CheckCircle, ShieldAlert, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Machine = {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  status: "ACTIVE" | "MAINTENANCE" | "FAULTY";
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

export default function AdminMachines() {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "MAINTENANCE" | "FAULTY">("ACTIVE");

  const handleUpdateStatus = (id: string, status: "ACTIVE" | "MAINTENANCE" | "FAULTY") => {
    setMachines(
      machines.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Maintenance</Badge>;
      case "FAULTY":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Faulty</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-gray-50/30 dark:bg-gray-900/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Machine Management</h2>
            <p className="text-sm text-muted-foreground">Manage physical washing machines, floor rotations, and checkup logs.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Add Machine
          </Button>
        </div>

        {/* Machine Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {machines.map((machine) => (
            <Card key={machine.id} className="shadow-sm border-blue-100/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-bold">{machine.serialNumber}</CardTitle>
                  <CardDescription>{machine.brand} {machine.model}</CardDescription>
                </div>
                {getStatusBadge(machine.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2 border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Current Location:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{machine.currentRoom}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Rotation Group:</span>
                    <span>Atlantic Hall Floor {machine.serialNumber.includes("W01") ? "1" : "2"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Movable Base Stand:</span>
                    <span className="flex items-center gap-1 font-semibold">
                      {machine.baseChecked ? (
                        <span className="text-green-600 flex items-center gap-0.5">✔️ Stabilized</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-0.5">⚠️ Needs Check</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Hose Connection:</span>
                    <span className="flex items-center gap-1 font-semibold">
                      {machine.hoseChecked ? (
                        <span className="text-green-600 flex items-center gap-0.5">✔️ Intact</span>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-0.5">⚠️ Verify tap seal</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Schedule Display */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Weekly Rotation Schedule (8:00 PM Transfer)
                  </h4>
                  <div className="grid grid-cols-7 gap-1 text-center bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-xs font-medium">
                    {machine.rotationSchedule.map((sched, idx) => {
                      const isToday = sched.room === machine.currentRoom;
                      return (
                        <div
                          key={idx}
                          className={`p-1.5 rounded ${
                            isToday
                              ? "bg-blue-600 text-white font-bold"
                              : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <div className="font-bold opacity-80">{sched.day.substring(0, 3)}</div>
                          <div className="text-[10px] mt-1">{sched.room.replace("Room ", "")}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Machine Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-transparent hover:bg-slate-100 hover:text-accent-foreground h-8 px-3 cursor-pointer"
                      onClick={() => {
                        setSelectedMachine(machine);
                        setNewStatus(machine.status);
                      }}
                    >
                      <Settings className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Configure Status
                    </DialogTrigger>
                    {selectedMachine?.id === machine.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configure Machine Status</DialogTitle>
                          <DialogDescription>Update machine availability status for WeWash students.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="status">Machine Status</Label>
                            <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
                              <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACTIVE">ACTIVE (Ready for Student Use)</SelectItem>
                                <SelectItem value="MAINTENANCE">MAINTENANCE (Scheduled Inspection)</SelectItem>
                                <SelectItem value="FAULTY">FAULTY (Out of order/needs repair)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedMachine(null)}>Cancel</Button>
                          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => {
                            handleUpdateStatus(machine.id, newStatus);
                            setSelectedMachine(null);
                          }}>
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => {
                    // Simulate manual transfer to next room
                    const nextRoomIndex = (machine.rotationSchedule.findIndex((s) => s.room === machine.currentRoom) + 1) % 7;
                    const nextRoom = machine.rotationSchedule[nextRoomIndex].room;
                    setMachines(
                      machines.map((m) => (m.id === machine.id ? { ...m, currentRoom: nextRoom } : m))
                    );
                  }}>
                    <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Force Transfer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transfer & Inspection History */}
        <Card className="shadow-sm border-blue-100/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Rotation Activity Logs</CardTitle>
            <CardDescription>Automatic and forced room-to-room transfer actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>To Location</TableHead>
                  <TableHead>Status Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs">Today, 8:00 PM</TableCell>
                  <TableCell className="font-semibold">WEWASH-W01-ATL</TableCell>
                  <TableCell>Scheduled Rotation</TableCell>
                  <TableCell>Room 101</TableCell>
                  <TableCell className="text-blue-600 dark:text-blue-400 font-medium">Room 102</TableCell>
                  <TableCell><Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Success</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">Yesterday, 8:00 PM</TableCell>
                  <TableCell className="font-semibold">WEWASH-W02-ATL</TableCell>
                  <TableCell>Scheduled Rotation</TableCell>
                  <TableCell>Room 202</TableCell>
                  <TableCell className="text-blue-600 dark:text-blue-400 font-medium">Room 203</TableCell>
                  <TableCell><Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Success</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs">2 days ago, 8:05 PM</TableCell>
                  <TableCell className="font-semibold">WEWASH-W01-ATL</TableCell>
                  <TableCell>Forced Manual Transfer</TableCell>
                  <TableCell>Room 107</TableCell>
                  <TableCell className="text-blue-600 dark:text-blue-400 font-medium">Room 101</TableCell>
                  <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Manual Override</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}
