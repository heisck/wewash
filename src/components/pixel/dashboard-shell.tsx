"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistedState, useRouteScrollMemory } from "@/hooks/use-persisted-state";
import { BlockyText, FONT5 } from "./blocky-text";
import { PixelIconButton } from "./pixel-ui";

export type ShellNavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

/* --------------------------------------------------------------------------
   Dashboard shell: deep-teal pixel sidebar + sticky header + checker canvas.
   Desktop: collapsible rail. Mobile: slide-over drawer.
-------------------------------------------------------------------------- */

export function DashboardShell({
  portal,
  note,
  navItems,
  userName,
  userMeta,
  userInitials,
  onLogout,
  children,
}: {
  portal: string; // e.g. "STUDENT" — rendered as blocky label
  note: string; // header context line
  navItems: ShellNavItem[];
  userName: string;
  userMeta: string;
  userInitials: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = usePersistedState(
    `shell:${portal}:collapsed`,
    false
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Restore scroll when returning to a page via the nav
  useRouteScrollMemory(pathname);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: ShellNavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const nav = (
    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
      <p
        className={cn(
          "mb-3 px-1 text-[8px] font-black uppercase tracking-[0.3em] text-teal-100/40",
          collapsed && "md:hidden"
        )}
      >
        {portal} portal
      </p>
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            title={item.name}
            className={cn(
              "group flex items-center gap-3 border-2 px-2.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-100",
              active
                ? "border-teal-950/60 bg-teal-400 text-teal-950 shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
                : "border-transparent text-teal-100/60 hover:border-teal-100/20 hover:bg-teal-100/5 hover:text-teal-50",
              collapsed && "md:justify-center md:px-0"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>{item.name}</span>
            {active && (
              <span
                className={cn("ml-auto h-1.5 w-1.5 bg-teal-950", collapsed && "md:hidden")}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t-2 border-teal-100/10 p-3">
      <div className={cn("flex items-center gap-2.5", collapsed && "md:justify-center")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-100/30 bg-teal-400/15 text-[10px] font-black tracking-widest text-teal-300">
          {userInitials}
        </span>
        <div className={cn("min-w-0 flex-1 text-left", collapsed && "md:hidden")}>
          <p className="truncate text-[10px] font-black uppercase tracking-wider text-teal-50">
            {userName}
          </p>
          <p className="truncate text-[9px] font-bold text-teal-100/40">{userMeta}</p>
        </div>
        <button
          onClick={onLogout}
          aria-label="Log out"
          className={cn(
            "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-2 border-transparent text-teal-100/50 transition-colors hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300",
            collapsed && "md:hidden"
          )}
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  const brand = (
    <div
      className={cn(
        "flex h-16 items-center border-b-2 border-teal-100/10 px-4",
        collapsed && "md:justify-center md:px-0"
      )}
    >
      <img src="/favicon.ico" alt="WeWash" className="h-9 w-9 shrink-0 object-contain" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eefaf8] text-teal-950 dark:bg-[#04100f] dark:text-teal-50">
      {/* ─── Desktop sidebar ─── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r-2 border-teal-950/80 bg-[#052b28] transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {brand}
        {nav}
        {footer}
      </aside>

      {/* ─── Mobile drawer ─── */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-teal-950/60 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-2 border-teal-950 bg-[#052b28] transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b-2 border-teal-100/10 px-4">
          <img src="/favicon.ico" alt="WeWash" className="h-9 w-9 object-contain" />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-teal-100/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {nav}
        {footer}
      </aside>

      {/* ─── Content column ─── */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "md:pl-16" : "md:pl-60"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b-2 border-teal-900/15 bg-[#eefaf8]/90 px-4 backdrop-blur-sm dark:border-teal-100/10 dark:bg-[#04100f]/90 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <PixelIconButton
              className="hidden h-9 w-9 md:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </PixelIconButton>
            <PixelIconButton
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <PanelLeft className="h-4 w-4" />
            </PixelIconButton>
            <span className="hidden h-4 w-0.5 bg-teal-900/20 dark:bg-teal-100/20 sm:block" aria-hidden="true" />
            <BlockyText
              text={note}
              font={FONT5}
              className="hidden max-w-[46vw] fill-teal-900/60 dark:fill-teal-100/60 sm:block"
              style={{ height: "9px" }}
            />
          </div>
          <PixelIconButton className="h-9 w-9" alert aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </PixelIconButton>
        </header>

        {/* Page canvas with subtle pixel checker */}
        <main className="bg-pixel-checker flex-1 overflow-x-hidden p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
