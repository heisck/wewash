"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutDashboard, CreditCard, Info, Settings } from "lucide-react";
import { DashboardShell } from "@/components/pixel/dashboard-shell";
import { PixelButton } from "@/components/pixel/pixel-ui";
import { safeSignOut, useSession } from "@/lib/auth/client";
import { useApi } from "@/lib/api/client";
import type { MeResponse } from "@/lib/types/client";

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
  const { data: session, isPending } = useSession();
  const {
    data: me,
    loading: meLoading,
    error: meError,
  } = useApi<MeResponse>(session ? "/api/v1/me" : null);
  const kickedRef = React.useRef(false);

  const role =
    me?.user.role ??
    (session?.user as { role?: string } | undefined)?.role ??
    null;

  /** Must be signed in as STUDENT with a linked Student row. */
  const allowed =
    !!session &&
    !!me &&
    role === "STUDENT" &&
    !!me.student &&
    me.student.isActive !== false;

  React.useEffect(() => {
    if (isPending || meLoading) return;
    if (!session) {
      router.replace("/login?callbackURL=/student");
      return;
    }
    if (allowed || kickedRef.current) return;

    // Signed in but no student profile / wrong role / /me failed
    kickedRef.current = true;
    const reason =
      role && role !== "STUDENT"
        ? "Student portal is for registered students only."
        : "No student account is linked to this login. Ask admin to register you.";

    toast.error(reason);
    void (async () => {
      await safeSignOut();
      router.replace(
        `/login?error=${encodeURIComponent(
          role && role !== "STUDENT"
            ? "student_only"
            : "no_student_profile"
        )}`
      );
    })();
  }, [
    session,
    isPending,
    meLoading,
    allowed,
    role,
    router,
  ]);

  if (isPending || (session && meLoading && !me)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] dark:bg-[#04100f]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.ico"
          alt="WeWash"
          className="h-12 w-12 animate-pulse object-contain"
        />
      </div>
    );
  }

  if (!session || !allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eefaf8] px-4 dark:bg-[#04100f]">
        <p className="max-w-sm text-center text-[11px] font-black uppercase tracking-widest text-teal-900/50 dark:text-teal-100/50">
          {!session
            ? "Redirecting to login…"
            : "Student account required — you cannot use this portal without one."}
        </p>
        {session && !allowed && (
          <PixelButton
            type="button"
            variant="outline"
            onClick={async () => {
              await safeSignOut();
              router.replace("/login");
            }}
          >
            Sign out
          </PixelButton>
        )}
      </div>
    );
  }

  const student = me.student!;
  const name = `${student.firstName} ${student.lastName}`.trim();
  const hall = student.room?.hall?.code || student.group?.hall?.code;
  const roomNo = student.room?.number || student.roomNumber || null;
  const meta =
    roomNo && hall
      ? `Room ${roomNo} • ${hall}`
      : roomNo
        ? `Room ${roomNo}`
        : "Subscribed";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardShell
      portal="Student"
      note={hall ? `${hall} • SUBSCRIBED` : "STUDENT"}
      navItems={menuItems}
      userName={name}
      userMeta={meta}
      userInitials={initials || "ST"}
      onLogout={async () => {
        await safeSignOut();
        router.replace("/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
