"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate admin login and redirect to Admin Overview
    setTimeout(() => {
      setIsLoading(false);
      router.push("/admin");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-12">
      {/* Top Brand Logo */}
      <div className="flex items-center gap-2 text-xl font-black text-blue-600 dark:text-blue-400 mb-12">
        <Droplet className="h-6 w-6 fill-current animate-pulse text-blue-500" />
        <span>WeWash Admin</span>
      </div>

      <div className="w-full max-w-[400px] flex flex-col items-center">
        <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-lg p-6 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="space-y-6 p-0">
            <div className="text-center space-y-1.5 pb-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Sign In</h2>
              <p className="text-xs text-muted-foreground">Access live appliance operations and subscription rosters.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@wewash.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 bg-slate-50/50 dark:bg-slate-900/50"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Password
                  </Label>
                  <a href="#" className="text-[11px] font-bold text-blue-600 hover:underline">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 bg-slate-50/50 dark:bg-slate-900/50"
                    required 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Go back helper */}
        <a 
          href="/login" 
          className="text-xs text-muted-foreground hover:text-slate-600 dark:hover:text-slate-300 mt-8 underline font-medium"
        >
          Access Student Portal
        </a>
      </div>
    </div>
  );
}
