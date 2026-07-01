import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface FindManyOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, "asc" | "desc">;
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

/**
 * Base Repository class.
 * All repositories should inherit from this to share a common Prisma client
 * and potentially common CRUD logic if needed.
 */
export abstract class BaseRepository {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Helper to execute a Prisma transaction.
   * Business logic goes in the callback.
   */
  protected async transaction<T>(
    fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
  ): Promise<T> {
    return this.db.$transaction(fn);
  }

  /**
   * Safe JSON parse helper for Prisma JSON fields.
   */
  protected parseJson<T>(jsonField: unknown, fallback: T): T {
    if (!jsonField) return fallback;
    if (typeof jsonField === "string") {
      try {
        return JSON.parse(jsonField) as T;
      } catch {
        return fallback;
      }
    }
    return jsonField as T;
  }
}
