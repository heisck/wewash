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
  LayoutDashboard, Activity, Users, Wrench, 
  LogOut, Droplet, UserCheck, Menu, Plus, Bell 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Manage admin auth state right on the /admin route
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // If not authenticated, render the Dribbble-style Admin Login screen directly on the /admin route
  if (!isAuthenticated) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsAuthenticated(true);
      }, 800);
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 py-12">
        {/* Top Brand Logo */}
        <div className="absolute top-8 flex items-center gap-1.5 text-xl font-black text-blue-600 dark:text-blue-400">
          <Droplet className="h-6 w-6 fill-current animate-pulse text-blue-500" />
          <span>
            WEW<span className="font-[family-name:var(--font-caveat)] font-normal lowercase tracking-normal text-blue-500 text-2xl">ash</span> Admin
          </span>
        </div>

        <div className="w-full max-w-[400px] flex flex-col items-center text-center">
          {/* Rounded Accent Icon */}
          <div className="h-16 w-16 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Droplet className="h-8 w-8 fill-current" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-xs text-muted-foreground mb-8">Admin Operations Center</p>

          {/* Dribbble style admin login form */}
          <div className="w-full flex flex-col items-center">
            {/* Google Sign In Button */}
            <Button 
              variant="outline" 
              type="button"
              className="w-full h-12 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center gap-3 font-semibold text-xs tracking-wide shadow-xs cursor-pointer bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
              onClick={() => setIsAuthenticated(true)}
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative py-5 w-full flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-950 px-3 text-slate-400 font-semibold tracking-wider text-[10px] uppercase">or</span>
              </div>
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleLoginSubmit} className="w-full space-y-4 text-left">
              <div className="space-y-1">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-center focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-sm bg-slate-50/30 focus:bg-white transition-all dark:bg-slate-900/30"
                  required 
                />
              </div>
              <div className="space-y-1">
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter security password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-center focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-sm bg-slate-50/30 focus:bg-white transition-all dark:bg-slate-900/30"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-sm shadow-sm transition-all cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Continue"}
              </Button>
            </form>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-slate-400 leading-normal mt-6 max-w-[320px]">
            By continuing, you agree to the{" "}
            <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>.
          </p>

          <a 
            href="/login" 
            className="text-xs text-blue-600 hover:underline mt-8 font-bold"
          >
            Access Student Portal
          </a>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Machines", href: "/admin/machines", icon: Activity },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Faults", href: "/admin/faults", icon: Wrench },
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
                  WEW<span className="font-[family-name:var(--font-caveat)] font-normal lowercase tracking-normal text-blue-500 text-xl">ash</span> Admin
                </span>
              </div>
            </SidebarHeader>

            <SidebarContent className="py-4">
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Management
                </SidebarGroupLabel>
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu className="space-y-1 px-2">
                    {menuItems.map((item) => {
                      const isActive = pathname === item.href;
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
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">AD</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Super Admin</p>
                  <p className="text-[10px] text-muted-foreground truncate">admin@wewash.com</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAuthenticated(false)}
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
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs sticky top-0 z-20">
              <div className="flex items-center">
                <SidebarTrigger className="mr-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer" />
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mr-4" />
                <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                  UCC Atlantic Hall Deploys • Live Operations
                </div>
              </div>
              
              {/* Notification bell on the far right */}
              <button className="h-9 w-9 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full flex items-center justify-center cursor-pointer relative shadow-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shrink-0">
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>
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
