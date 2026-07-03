"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Calendar, CheckCircle, Download, Search } from "lucide-react";
import {
  PageTitle, PixelBadge, PixelButton, PixelCard, PixelInput,
  PixelTd, PixelTh, SectionTitle, StatTile,
} from "@/components/pixel/pixel-ui";

const payments = [
  { id: "TXN-001", desc: "Weekly Dues", amount: "GHS 35.00", method: "Mobile Money", date: "Jul 1, 2026", status: "Completed" },
  { id: "TXN-002", desc: "One-time Setup Fee", amount: "GHS 50.00", method: "Manual", date: "Oct 1, 2026", status: "Completed" },
  { id: "TXN-003", desc: "Weekly Dues", amount: "GHS 35.00", method: "Mobile Money", date: "Jun 24, 2026", status: "Completed" },
  { id: "TXN-004", desc: "Weekly Dues", amount: "GHS 35.00", method: "Mobile Money", date: "Jun 17, 2026", status: "Completed" },
  { id: "TXN-005", desc: "Weekly Dues", amount: "GHS 35.00", method: "Mobile Money", date: "Jun 10, 2026", status: "Pending" },
];

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = payments.filter(
    (p) =>
      p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle text="PAYMENTS" sub="Dues, receipts & rotation billing" />
        <PixelButton
          variant="outline"
          onClick={() => toast.info("Exporting your payment history...")}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </PixelButton>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Outstanding"
          value="₵0.00"
          sub={<span className="text-emerald-600 dark:text-emerald-400">All cleared ✓</span>}
          icon={<CreditCard />}
        />
        <StatTile
          label="Total paid"
          value="₵190.00"
          sub="Since Oct 2026"
          icon={<CheckCircle />}
        />
        <StatTile
          label="Next due"
          value="₵35.00"
          sub="Jul 8, 2026"
          icon={<Calendar />}
        />
      </div>

      {/* Transaction history */}
      <div className="space-y-4">
        <SectionTitle
          text="TRANSACTION HISTORY"
          right={
            <div className="relative w-full max-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-teal-900/40 dark:text-teal-100/40" />
              <PixelInput
                placeholder="Search transactions..."
                className="h-9 pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          }
        />

        <PixelCard className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b-2 border-teal-900/15 dark:border-teal-100/15">
                <PixelTh className="pt-4">Ref</PixelTh>
                <PixelTh className="pt-4">Description</PixelTh>
                <PixelTh className="pt-4">Amount</PixelTh>
                <PixelTh className="pt-4">Method</PixelTh>
                <PixelTh className="pt-4">Date</PixelTh>
                <PixelTh className="pt-4">Status</PixelTh>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-teal-900/5 dark:divide-teal-100/5">
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-teal-600/5 dark:hover:bg-teal-400/5"
                >
                  <PixelTd className="text-[10px] font-black text-teal-900/50 dark:text-teal-100/50">
                    {tx.id}
                  </PixelTd>
                  <PixelTd>{tx.desc}</PixelTd>
                  <PixelTd className="font-black">{tx.amount}</PixelTd>
                  <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                    {tx.method}
                  </PixelTd>
                  <PixelTd className="text-[10px] text-teal-900/50 dark:text-teal-100/50">
                    {tx.date}
                  </PixelTd>
                  <PixelTd>
                    <PixelBadge tone={tx.status === "Completed" ? "green" : "amber"}>
                      {tx.status}
                    </PixelBadge>
                  </PixelTd>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-teal-900/40 dark:text-teal-100/40">
              No transactions found.
            </p>
          )}
        </PixelCard>
      </div>
    </div>
  );
}
