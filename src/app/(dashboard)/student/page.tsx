"use client";

import { Bell, Calendar, CreditCard, Droplet, FileWarning, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen w-full bg-gray-50/50 dark:bg-gray-950/50">
      {/* Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 px-6 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Droplet className="h-6 w-6 text-blue-500" />
          <span className="hidden sm:inline-block">WeWash Student</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@student" />
            <AvatarFallback>ST</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, John Doe. Here is your laundry status.</p>
          </div>
          <Button>
            <FileWarning className="mr-2 h-4 w-4" />
            Report Fault
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Machine Status Card */}
          <Card className="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border-blue-100 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardDescription>Current Machine Assignment</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                Machine #W04
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-300">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Your Turn: Wednesday</p>
                    <p className="text-sm text-muted-foreground">Today is Tuesday. Room 302 currently has access.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Subscription Status</CardDescription>
              <CardTitle className="text-2xl">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valid Until:</span>
                  <span className="font-medium">Dec 31, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Dues:</span>
                  <span className="font-medium">GHS 50.00</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t mt-2">
                  <span className="text-muted-foreground">Outstanding:</span>
                  <span className="font-medium text-red-500">GHS 0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-semibold tracking-tight mt-8 mb-4">Recent Activity</h2>
        <Card>
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Payment Received</p>
                    <p className="text-xs text-muted-foreground">GHS 50.00 via Mobile Money</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Oct 12, 2026</div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
