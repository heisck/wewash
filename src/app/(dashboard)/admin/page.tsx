"use client";

import { Activity, CreditCard, DollarSign, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-gray-50/30 dark:bg-gray-900/10">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-sm text-muted-foreground">Pilot Phase: Atlantic Hall Deployment</p>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Weekly Income</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHS 1,020.00</div>
              <p className="text-xs text-muted-foreground">₵35 - ₵40 per student rate</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">100% room capacity (14 rooms)</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployed Machines</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 / 2</div>
              <p className="text-xs text-muted-foreground">Movable bases locked & active</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Faults</CardTitle>
              <Wrench className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Machine W02 (Minor noise)</p>
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
  );
}
