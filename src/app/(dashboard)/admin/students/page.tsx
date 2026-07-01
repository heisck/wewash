"use client";

import { useState } from "react";
import { Users, UserPlus, CreditCard, Send, Search, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Student = {
  id: string;
  name: string;
  studentId: string;
  room: string;
  phone: string;
  contractStatus: "ACTIVE" | "EXPIRED" | "TERMINATED";
  paymentStatus: "PAID" | "UNPAID" | "OVERDUE";
  outstandingBalance: number;
};

const initialStudents: Student[] = [
  {
    id: "s1",
    name: "John Doe",
    studentId: "UCC/ATL/24/0045",
    room: "Room 101",
    phone: "+233241234567",
    contractStatus: "ACTIVE",
    paymentStatus: "PAID",
    outstandingBalance: 0.0,
  },
  {
    id: "s2",
    name: "Sarah Mensah",
    studentId: "UCC/ATL/24/0112",
    room: "Room 102",
    phone: "+233559876543",
    contractStatus: "ACTIVE",
    paymentStatus: "UNPAID",
    outstandingBalance: 35.0,
  },
  {
    id: "s3",
    name: "Emmanuel Boateng",
    studentId: "UCC/ATL/24/0089",
    room: "Room 103",
    phone: "+233201112223",
    contractStatus: "ACTIVE",
    paymentStatus: "OVERDUE",
    outstandingBalance: 70.0, // 2 weeks overdue
  },
  {
    id: "s4",
    name: "Abigail Larbi",
    studentId: "UCC/ATL/24/0290",
    room: "Room 201",
    phone: "+233504445555",
    contractStatus: "ACTIVE",
    paymentStatus: "PAID",
    outstandingBalance: 0.0,
  },
  {
    id: "s5",
    name: "Michael Tetteh",
    studentId: "UCC/ATL/24/0301",
    room: "Room 202",
    phone: "+233245556667",
    contractStatus: "ACTIVE",
    paymentStatus: "UNPAID",
    outstandingBalance: 40.0,
  },
];

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [paymentRef, setPaymentRef] = useState("");

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setStudents(
      students.map((student) => {
        if (student.id === selectedStudent.id) {
          const newOutstanding = Math.max(0, student.outstandingBalance - amount);
          return {
            ...student,
            outstandingBalance: newOutstanding,
            paymentStatus: newOutstanding === 0 ? "PAID" : "UNPAID",
          };
        }
        return student;
      })
    );

    // Reset Form
    setSelectedStudent(null);
    setPaymentAmount("");
    setPaymentRef("");
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Paid</Badge>;
      case "UNPAID":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Unpaid</Badge>;
      case "OVERDUE":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-gray-50/30 dark:bg-gray-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Student Subscriptions</h2>
            <p className="text-sm text-muted-foreground">Manage active student rosters, contract compliance, and record weekly dues.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
            <UserPlus className="mr-2 h-4 w-4" /> Register Student
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, room, or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        <Card className="shadow-sm border-blue-100/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Dues Outstanding</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-semibold">{student.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{student.studentId}</TableCell>
                      <TableCell className="font-medium text-blue-600 dark:text-blue-400">{student.room}</TableCell>
                      <TableCell className="text-xs font-mono">{student.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {student.contractStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPaymentBadge(student.paymentStatus)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        GHS {student.outstandingBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Dialog>
                          <DialogTrigger
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-blue-200 bg-transparent hover:bg-blue-50/50 h-8 px-3 cursor-pointer"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <CreditCard className="mr-1 h-3.5 w-3.5 text-blue-500" /> Pay
                          </DialogTrigger>
                          {selectedStudent?.id === student.id && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record Manual Payment</DialogTitle>
                                <DialogDescription>
                                  Enter payment details received from <strong>{student.name}</strong> ({student.room}).
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
                                <div className="space-y-2">
                                  <Label htmlFor="amount">Amount Paid (GHS)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder={student.outstandingBalance.toString()}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="method">Payment Method</Label>
                                  <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "")}>
                                    <SelectTrigger id="method">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="MOBILE_MONEY">Mobile Money (MTN/Vodafone)</SelectItem>
                                      <SelectItem value="CASH">Hand-delivered Cash</SelectItem>
                                      <SelectItem value="BANK_TRANSFER">Bank Direct Transfer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="ref">MoMo Transaction ID / Reference</Label>
                                  <Input
                                    id="ref"
                                    placeholder="e.g., TXN2026070188"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    required={paymentMethod === "MOBILE_MONEY"}
                                  />
                                </div>
                                <DialogFooter className="pt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedStudent(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Record Payment
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          )}
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs hover:text-blue-600"
                          onClick={() => {
                            alert(`SMS reminder triggered via Arkesel client to ${student.phone}`);
                          }}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No matching students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}
