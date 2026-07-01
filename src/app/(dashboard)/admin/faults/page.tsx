"use client";

import { useState } from "react";
import { Wrench, CheckCircle2, ShieldAlert, Clock, AlertTriangle, PenTool, CheckSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Fault = {
  id: string;
  machineSerial: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";
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
          ? {
              ...f,
              status: "RESOLVED",
              cost: parseFloat(repairCost) || 0,
            }
          : f
      )
    );

    setSelectedFault(null);
    setResolutionText("");
    setRepairCost("");
  };

  const handleAcknowledge = (id: string) => {
    setFaults(
      faults.map((f) => (f.id === id ? { ...f, status: "IN_PROGRESS" } : f))
    );
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge className="bg-red-700 text-white border-red-800">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-red-500 text-white">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case "LOW":
        return <Badge className="bg-blue-500 text-white">Low</Badge>;
      default:
        return <Badge variant="outline">{sev}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REPORTED":
        return <Badge variant="secondary" className="flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Reported</Badge>;
      case "ACKNOWLEDGED":
        return <Badge className="bg-slate-200 text-slate-800 flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3 text-slate-600" /> Acknowledged</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1 w-fit"><Clock className="h-3 w-3 text-yellow-600" /> In Progress</Badge>;
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3 text-green-600" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-gray-50/30 dark:bg-gray-900/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Fault Reports</h2>
            <p className="text-sm text-muted-foreground">Track machine breakdown tickets, resolve faults, and inspect weekly logs.</p>
          </div>
        </div>

        {/* Active Fault Tickets */}
        <Card className="shadow-sm border-blue-100/50">
          <CardHeader>
            <CardTitle>Active Tickets</CardTitle>
            <CardDescription>Review and update repair progress for machines.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Deducted Cost</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faults.map((fault) => (
                  <TableRow key={fault.id}>
                    <TableCell className="font-semibold">{fault.machineSerial}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{fault.title}</div>
                        <div className="text-xs text-muted-foreground max-w-sm truncate">{fault.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(fault.severity)}</TableCell>
                    <TableCell className="text-xs">{fault.reportedBy}</TableCell>
                    <TableCell className="text-xs">{fault.date}</TableCell>
                    <TableCell>{getStatusBadge(fault.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fault.cost ? `GHS ${fault.cost.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {fault.status !== "RESOLVED" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(fault.id)}
                            disabled={fault.status === "IN_PROGRESS"}
                            className="text-xs h-8"
                          >
                            Work On
                          </Button>
                          <Dialog>
                            <DialogTrigger
                              className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 h-8 px-3 cursor-pointer"
                              onClick={() => setSelectedFault(fault)}
                            >
                              Resolve
                            </DialogTrigger>
                            {selectedFault?.id === fault.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Resolve Fault Ticket</DialogTitle>
                                  <DialogDescription>
                                    Mark the machine fault resolved and record repair costs.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleResolveFault} className="space-y-4 py-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="resolution">Resolution Details</Label>
                                    <textarea
                                      id="resolution"
                                      placeholder="Describe what was fixed (e.g., cleared debris, replaced seal, adjusted bases)..."
                                      value={resolutionText}
                                      onChange={(e) => setResolutionText(e.target.value)}
                                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                                      required
                                    ></textarea>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="cost">Actual Repair Cost (GHS)</Label>
                                    <Input
                                      id="cost"
                                      type="number"
                                      placeholder="150"
                                      value={repairCost}
                                      onChange={(e) => setRepairCost(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setSelectedFault(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                      Save Resolution
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            )}
                          </Dialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Weekly Inspection Checklist */}
        <Card className="shadow-sm border-blue-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-lg">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              Weekly Maintenance & Safety Inspections
            </CardTitle>
            <CardDescription>Checklist performed by WeWash administrators every weekend.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">WEWASH-W01-ATL</h4>
                  <Badge variant="outline" className="text-green-600 border-green-200">Checked Oct 24</Badge>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">✔️ Hoses and tap seals tight, no leakage</li>
                  <li className="flex items-center gap-2">✔️ Movable stand lockable wheels functional</li>
                  <li className="flex items-center gap-2">✔️ Door seals cleaned and checked for mold</li>
                  <li className="flex items-center gap-2">✔️ Running test programs successfully completed</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">WEWASH-W02-ATL</h4>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pending Oct 31</Badge>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">✔️ Hoses and tap seals tight, no leakage</li>
                  <li className="flex items-center gap-2">⚠️ Check stand stability legs (Vibration report active)</li>
                  <li className="flex items-center gap-2">✔️ Door seals cleaned and checked for mold</li>
                  <li className="flex items-center gap-2">❓ Running test programs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
