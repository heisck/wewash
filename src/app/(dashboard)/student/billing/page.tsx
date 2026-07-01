"use client";

import { useState } from "react";
import {
  CreditCard, ArrowRight, Calendar, CheckCircle, Clock,
  Download, Filter, Search, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    (p) => p.desc.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-black text-slate-900 dark:text-white">Payments & Dues</h1>
        <Button variant="outline" className="rounded-full text-xs font-bold gap-2 h-9 px-2.5 sm:px-4 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Summary Metrics Bar - Edge to Edge */}
      <div className="-mx-6 md:-mx-8 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* Outstanding */}
          <div className="pl-6 md:pl-8 pr-4 sm:pr-5 py-4 sm:py-5 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Outstanding</span>
              <CreditCard className="h-3.5 w-3.5 text-slate-300 shrink-0 hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">₵0.00</h3>
              <p className="text-[8px] sm:text-[9px] text-green-500 font-bold mt-1 truncate">All cleared ✓</p>
            </div>
          </div>

          {/* Total Paid */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Total Paid</span>
              <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0 hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">₵190.00</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1 truncate">Since Oct 2026</p>
            </div>
          </div>

          {/* Next Due */}
          <div className="pl-4 sm:pl-5 pr-6 md:pr-8 py-4 sm:py-5 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Next Due</span>
              <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0 hidden sm:block" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">₵35.00</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1 truncate">Jul 8, 2026</p>
            </div>
          </div>

        </div>
      </div>

      {/* Transaction History */}
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Transaction History</h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search transactions..."
              className="pl-9 h-9 rounded-full text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-3 pr-4">Ref</th>
                <th className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-3 pr-4">Description</th>
                <th className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-3 pr-4">Amount</th>
                <th className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-3 pr-4 hidden sm:table-cell">Method</th>
                <th className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-3 pr-4 hidden md:table-cell">Date</th>
                <th className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-white/40 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="py-3.5 pr-4 text-[10px] font-bold text-slate-500">{tx.id}</td>
                  <td className="py-3.5 pr-4 text-xs font-semibold text-slate-800 dark:text-slate-200">{tx.desc}</td>
                  <td className="py-3.5 pr-4 text-xs font-black text-slate-900 dark:text-white">{tx.amount}</td>
                  <td className="py-3.5 pr-4 text-[10px] font-semibold text-slate-400 hidden sm:table-cell">{tx.method}</td>
                  <td className="py-3.5 pr-4 text-[10px] font-semibold text-slate-400 hidden md:table-cell">{tx.date}</td>
                  <td className="py-3.5">
                    <Badge className={`text-[8px] rounded-full font-bold px-2 py-0.5 border ${
                      tx.status === "Completed"
                        ? "bg-green-50 text-green-600 border-green-200/20 dark:bg-green-950/30"
                        : "bg-amber-50 text-amber-600 border-amber-200/20 dark:bg-amber-950/30"
                    }`}>
                      {tx.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 font-semibold">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
