import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * Prisma client singleton.
 * In development, we store the client on globalThis to survive HMR.
 * After `prisma generate` adds models, a stale global client can miss them
 * (e.g. studentGroup.create → undefined). Detect and recreate.
 */
function getPrisma(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) {
    // Sentinel for latest schema — extend if new models are added and HMR breaks
    const client = existing as PrismaClient & {
      studentGroup?: { create: unknown };
    };
    if (typeof client.studentGroup?.create === "function") {
      return existing;
    }
    // Stale client from before generate — drop it
    void existing.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();

export default prisma;
