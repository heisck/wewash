import { prisma } from "@/lib/db/prisma";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";

export class AnalyticsService {
  async getDashboardStats(user: User | null) {
    requirePermission(user, "system_config", "read"); // Admin read-only permission

    const [
      activeStudents,
      totalMachines,
      faultyMachines,
      maintenanceMachines,
      activeContracts,
      totalPayments,
    ] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null, isActive: true } }),
      prisma.machine.count({ where: { deletedAt: null } }),
      prisma.machine.count({ where: { deletedAt: null, status: "FAULTY" } }),
      prisma.machine.count({ where: { deletedAt: null, status: "MAINTENANCE" } }),
      prisma.contract.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const revenue = totalPayments._sum.amount?.toNumber() || 0;

    return {
      activeStudents,
      machines: {
        total: totalMachines,
        faulty: faultyMachines,
        maintenance: maintenanceMachines,
        active: totalMachines - faultyMachines - maintenanceMachines,
      },
      activeContracts,
      revenue,
    };
  }
}

export const analyticsService = new AnalyticsService();
