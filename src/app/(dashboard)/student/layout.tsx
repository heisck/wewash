"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, 
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, 
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarProvider, SidebarTrigger, SidebarInset
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  LayoutDashboard, CreditCard, Info, 
  LogOut, Droplet 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  const menuItems = [
    { name: "My Dashboard", href: "/student", icon: LayoutDashboard },
    { name: "Payments & Dues", href: "/student#billing", icon: CreditCard },
    { name: "Appliance Guide", href: "/student#guidelines", icon: Info },
  ];

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-slate-50/30 dark:bg-slate-900/10">
          {/* Sidebar */}
          <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-slate-800">
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2 font-bold text-lg text-blue-600 dark:text-blue-400 group-data-[collapsible=icon]:justify-center w-full">
                <Droplet className="h-5 w-5 fill-current animate-pulse text-blue-500 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden font-extrabold tracking-tight">
                  WEW<span className="font-[family-name:var(--font-caveat)] font-normal lowercase tracking-normal text-blue-500 text-xl">ash</span>
                </span>
              </div>
            </SidebarHeader>

            <SidebarContent className="py-4">
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Student Portal
                </SidebarGroupLabel>
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu className="space-y-1 px-2">
                    {menuItems.map((item) => {
                      const isActive = item.href.includes("#")
                        ? pathname === item.href.split("#")[0] && currentHash === item.href.substring(item.href.indexOf("#"))
                        : pathname === item.href && currentHash === "";
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton 
                            render={<Link href={item.href} />}
                            isActive={isActive}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                              isActive 
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold" 
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                            <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3 p-1.5 rounded-lg group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 border border-blue-200">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@student" />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">ST</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">John Doe</p>
                  <p className="text-[10px] text-muted-foreground truncate">Room 104 • ATL</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push("/login")}
                  className="h-8 w-8 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 group-data-[collapsible=icon]:hidden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* Main Content Area */}
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            {/* Top Toolbar */}
            <header className="h-16 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs sticky top-0 z-20">
              <SidebarTrigger className="mr-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer" />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mr-4" />
              <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                Atlantic Hall Floor 1 • Subscribed
              </div>
            </header>

            {/* Sub-page Content */}
            <main className="flex-1 overflow-y-auto bg-[#F5F6F8] dark:bg-[#10141e] p-6 md:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
