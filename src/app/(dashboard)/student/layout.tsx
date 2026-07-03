"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, Info, Settings } from "lucide-react";
import { DashboardShell } from "@/components/pixel/dashboard-shell";
import { authClient, useSession } from "@/lib/auth/client";
import { useApi } from "@/lib/api/client";
import type { MeResponse } from "@/lib/types/client";

const menuItems = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard, exact: true },
  { name: "Payments", href: "/student/billing", icon: CreditCard },
  { name: "Guide", href: "/student/guidelines", icon: Info },
  { name: "Settings", href: "/student/settings", icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: me } = useApi<MeResponse>(session ? "/api/v1/me" : null);

  const user = session?.user as { name?: string; email?: string } | undefined;

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] dark:bg-[#04100f]">
        <img src="/favicon.ico" alt="WeWash" className="h-12 w-12 animate-pulse object-contain" />
      </div>
    );
  }

  const name = me?.student
    ? `${me.student.firstName} ${me.student.lastName}`.trim()
    : user?.name || "Student";
  const hall = me?.student?.room?.hall?.code;
  const roomNo = me?.student?.room?.number;
  const meta = roomNo && hall ? `Room ${roomNo} • ${hall}` : "Subscribed";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardShell
      portal="Student"
      note={hall ? `${hall} • SUBSCRIBED` : "SUBSCRIBED"}
      navItems={menuItems}
      userName={name}
      userMeta={meta}
      userInitials={initials || "ST"}
      onLogout={async () => {
        await authClient.signOut();
        router.push("/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
