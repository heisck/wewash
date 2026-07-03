"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, CreditCard, Send, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput, PixelLabel,
  PixelSelect, PixelTd, PixelTh,
} from "@/components/pixel/pixel-ui";

type PaymentStatus = "PAID" | "UNPAID" | "OVERDUE";

type Student = {
  id: string;
  name: string;
  studentId: string;
  room: string;
  phone: string;
  contractStatus: "ACTIVE" | "EXPIRED" | "TERMINATED";
  paymentStatus: PaymentStatus;
  outstandingBalance: number;
};

const initialStudents: Student[] = [
  { id: "s1", name: "John Doe", studentId: "UCC/ATL/24/0045", room: "Room 101", phone: "+233241234567", contractStatus: "ACTIVE", paymentStatus: "PAID", outstandingBalance: 0.0 },
  { id: "s2", name: "Sarah Mensah", studentId: "UCC/ATL/24/0112", room: "Room 102", phone: "+233559876543", contractStatus: "ACTIVE", paymentStatus: "UNPAID", outstandingBalance: 35.0 },
  { id: "s3", name: "Emmanuel Boateng", studentId: "UCC/ATL/24/0089", room: "Room 103", phone: "+233201112223", contractStatus: "ACTIVE", paymentStatus: "OVERDUE", outstandingBalance: 70.0 },
  { id: "s4", name: "Abigail Larbi", studentId: "UCC/ATL/24/0290", room: "Room 201", phone: "+233504445555", contractStatus: "ACTIVE", paymentStatus: "PAID", outstandingBalance: 0.0 },
  { id: "s5", name: "Michael Tetteh", studentId: "UCC/ATL/24/0301", room: "Room 202", phone: "+233245556667", contractStatus: "ACTIVE", paymentStatus: "UNPAID", outstandingBalance: 40.0 },
];

const paymentTone: Record<PaymentStatus, "green" | "amber" | "red"> = {
  PAID: "green",
  UNPAID: "amber",
  OVERDUE: "red",
};

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

    toast.success(`GHS ${amount.toFixed(2)} recorded for ${selectedStudent.name}.`);
    setSelectedStudent(null);
    setPaymentAmount("");
    setPaymentRef("");
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="STUDENTS" sub="Rosters, contracts & weekly dues" />
        <PixelButton onClick={() => toast.info("Student registration form coming soon.")}>
          <UserPlus className="h-3.5 w-3.5" /> Register student
        </PixelButton>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-900/40 dark:text-teal-100/40" />
        <PixelInput
          placeholder="Search by name, room, or ID..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Roster table */}
      <PixelCard className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
              <PixelTh className="pt-4">Student</PixelTh>
              <PixelTh className="pt-4">Student ID</PixelTh>
              <PixelTh className="pt-4">Room</PixelTh>
              <PixelTh className="pt-4">Phone</PixelTh>
              <PixelTh className="pt-4">Contract</PixelTh>
              <PixelTh className="pt-4">Payment</PixelTh>
              <PixelTh className="pt-4 text-right">Outstanding</PixelTh>
              <PixelTh className="pt-4 text-right">Actions</PixelTh>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5"
                >
                  <PixelTd className="font-black">{student.name}</PixelTd>
                  <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                    {student.studentId}
                  </PixelTd>
                  <PixelTd className="font-black text-teal-700 dark:text-teal-300">
                    {student.room}
                  </PixelTd>
                  <PixelTd className="font-mono text-[10px] text-teal-900/60 dark:text-teal-100/60">
                    {student.phone}
                  </PixelTd>
                  <PixelTd>
                    <PixelBadge tone="teal">{student.contractStatus}</PixelBadge>
                  </PixelTd>
                  <PixelTd>
                    <PixelBadge tone={paymentTone[student.paymentStatus]}>
                      {student.paymentStatus}
                    </PixelBadge>
                  </PixelTd>
                  <PixelTd className="text-right font-black">
                    GHS {student.outstandingBalance.toFixed(2)}
                  </PixelTd>
                  <PixelTd className="text-right">
                    <div className="flex justify-end gap-2">
                      <PixelButton
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <CreditCard className="h-3 w-3" /> Pay
                      </PixelButton>
                      <PixelButton
                        size="sm"
                        variant="ghost"
                        aria-label={`Send SMS reminder to ${student.name}`}
                        onClick={() =>
                          toast.success(`SMS reminder queued via Arkesel to ${student.phone}.`)
                        }
                      >
                        <Send className="h-3.5 w-3.5" />
                      </PixelButton>
                    </div>
                  </PixelTd>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40"
                >
                  No matching students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </PixelCard>

      {/* Record payment dialog */}
      <Dialog
        open={selectedStudent !== null}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
      >
        <DialogContent className="border-2 border-teal-900/30 shadow-pixel-lg dark:border-teal-100/25">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">
              Record manual payment
            </DialogTitle>
            <DialogDescription>
              Enter payment details received from <strong>{selectedStudent?.name}</strong> (
              {selectedStudent?.room}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
            <div className="space-y-2">
              <PixelLabel htmlFor="amount">Amount paid (GHS)</PixelLabel>
              <PixelInput
                id="amount"
                type="number"
                step="0.01"
                placeholder={selectedStudent?.outstandingBalance.toString()}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="method">Payment method</PixelLabel>
              <PixelSelect
                id="method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="MOBILE_MONEY">Mobile Money (MTN/Vodafone)</option>
                <option value="CASH">Hand-delivered Cash</option>
                <option value="BANK_TRANSFER">Bank Direct Transfer</option>
              </PixelSelect>
            </div>
            <div className="space-y-2">
              <PixelLabel htmlFor="ref">MoMo transaction ID / reference</PixelLabel>
              <PixelInput
                id="ref"
                placeholder="e.g., TXN2026070188"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                required={paymentMethod === "MOBILE_MONEY"}
              />
            </div>
            <DialogFooter className="gap-2 pt-4">
              <PixelButton type="button" variant="outline" onClick={() => setSelectedStudent(null)}>
                Cancel
              </PixelButton>
              <PixelButton type="submit">Record payment</PixelButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
