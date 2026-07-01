"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login and redirect to Student Dashboard
    setTimeout(() => {
      setIsLoading(false);
      router.push("/student");
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Google Sign In Button */}
      <Button 
        variant="outline" 
        type="button"
        className="w-full h-12 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center gap-3 font-semibold text-xs tracking-wide shadow-xs cursor-pointer bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
        onClick={() => router.push("/student")}
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

      {/* Phone login form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="space-y-2">
          <Input 
            id="phone" 
            type="tel" 
            placeholder="Enter phone number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
  );
}
