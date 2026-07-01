"use client";

import { Activity, CreditCard, DollarSign, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  return (
    <div className="flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="font-bold text-xl mr-8">WeWash Admin</div>
          <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
            <a href="/admin" className="text-sm font-medium transition-colors hover:text-primary">Overview</a>
            <a href="/admin/machines" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Machines</a>
            <a href="/admin/students" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Students</a>
            <a href="/admin/faults" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Faults</a>
          </nav>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHS 45,231.89</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2350</div>
              <p className="text-xs text-muted-foreground">+180 new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12,234</div>
              <p className="text-xs text-muted-foreground">+19% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Faults</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-red-500 font-medium">+3 since yesterday</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Fault Reports</CardTitle>
              <CardDescription>There are 12 open fault reports needing attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">W04</TableCell>
                    <TableCell>Not draining water</TableCell>
                    <TableCell><Badge variant="destructive">High</Badge></TableCell>
                    <TableCell>Today, 2:00 PM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">W12</TableCell>
                    <TableCell>Strange noise during spin</TableCell>
                    <TableCell><Badge variant="secondary">Medium</Badge></TableCell>
                    <TableCell>Yesterday</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest manual payment entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  { name: "Olivia Martin", amount: "GHS 50.00", status: "Completed" },
                  { name: "Jackson Lee", amount: "GHS 150.00", status: "Completed" },
                  { name: "Isabella Nguyen", amount: "GHS 50.00", status: "Pending" }
                ].map((payment, i) => (
                  <div key={i} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{payment.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{payment.name}</p>
                      <p className="text-sm text-muted-foreground">{payment.status}</p>
                    </div>
                    <div className="ml-auto font-medium">+{payment.amount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
