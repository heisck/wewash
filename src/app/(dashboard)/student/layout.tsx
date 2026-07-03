"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, Info, Settings } from "lucide-react";
import { DashboardShell } from "@/components/pixel/dashboard-shell";

const menuItems = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard, exact: true },
  { name: "Payments", href: "/student/billing", icon: CreditCard },
  { name: "Guide", href: "/student/guidelines", icon: Info },
  { name: "Settings", href: "/student/settings", icon: Settings },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <DashboardShell
      portal="Student"
      note="ATLANTIC HALL FLOOR 1 - SUBSCRIBED"
      navItems={menuItems}
      userName="John Doe"
      userMeta="Room 104 • ATL"
      userInitials="JD"
      onLogout={() => router.push("/login")}
    >
      {children}
    </DashboardShell>
  );
}
