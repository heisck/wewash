import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return NextResponse.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        database: "UP",
        cache: "UP",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "DOWN",
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
