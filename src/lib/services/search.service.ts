import { prisma } from "@/lib/db/prisma";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";

export class SearchService {
  async globalSearch(user: User | null, query: string) {
    requirePermission(user, "system_config", "read"); // Require admin read-level permissions

    if (!query || query.trim().length < 2) {
      return { students: [], machines: [], halls: [] };
    }

    const trimmed = query.trim();

    const [students, machines, halls] = await Promise.all([
      prisma.student.findMany({
        where: {
          deletedAt: null,
          OR: [
            { studentId: { contains: trimmed, mode: "insensitive" } },
            { firstName: { contains: trimmed, mode: "insensitive" } },
            { lastName: { contains: trimmed, mode: "insensitive" } },
            { phone: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
      prisma.machine.findMany({
        where: {
          deletedAt: null,
          OR: [
            { serialNumber: { contains: trimmed, mode: "insensitive" } },
            { brand: { contains: trimmed, mode: "insensitive" } },
            { model: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
      prisma.hall.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { code: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
    ]);

    return { students, machines, halls };
  }
}

export const searchService = new SearchService();
