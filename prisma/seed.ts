/**
 * Seed script — creates a demo hall with 7 rooms, one machine on a full
 * 7-day rotation, and a SUPER_ADMIN account. Run with: npm run db:seed
 *
 * NOTE: the admin is created with a hashed password via Better Auth's own
 * sign-up endpoint is NOT used here; instead we insert a credential account
 * only if BETTER_AUTH is configured. For a quick start, sign in with Google
 * or the seeded email once you set a password through the app.
 */
import { PrismaClient, DayOfWeek } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const DAYS: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

async function main() {
  console.log("🌱 Seeding WeWash demo data...");

  // ── Hall ──
  const hall = await prisma.hall.upsert({
    where: { code: "ATL" },
    update: {},
    create: {
      name: "Atlantic Hall",
      code: "ATL",
      location: "North Campus",
      capacity: 14,
    },
  });

  // ── Rooms (7) ──
  const rooms = [];
  for (let i = 1; i <= 7; i++) {
    const number = `10${i}`;
    const room = await prisma.room.upsert({
      where: { hallId_number: { hallId: hall.id, number } },
      update: {},
      create: { number, floor: 1, capacity: 2, hallId: hall.id },
    });
    rooms.push(room);
  }

  // ── Machine ──
  const machine = await prisma.machine.upsert({
    where: { serialNumber: "WEWASH-W01-ATL" },
    update: {},
    create: {
      serialNumber: "WEWASH-W01-ATL",
      qrToken: randomBytes(16).toString("hex"),
      brand: "Samsung",
      model: "WW70",
      status: "ACTIVE",
      hallId: hall.id,
    },
  });

  // ── Rotation: one room per day, 20:00 → 20:00 next day ──
  for (let i = 0; i < 7; i++) {
    const day = DAYS[i];
    await prisma.machineSchedule.upsert({
      where: { machineId_dayOfWeek: { machineId: machine.id, dayOfWeek: day } },
      update: { roomId: rooms[i].id, startTime: "20:00", endTime: "20:00", orderIndex: i },
      create: {
        machineId: machine.id,
        roomId: rooms[i].id,
        dayOfWeek: day,
        startTime: "20:00",
        endTime: "20:00",
        orderIndex: i,
      },
    });
  }

  // ── Super Admin user (link a Google/email login to it in the app) ──
  await prisma.user.upsert({
    where: { email: "admin@wewash.app" },
    update: { role: "SUPER_ADMIN" },
    create: {
      name: "Super Admin",
      email: "admin@wewash.app",
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  // ── Contact config (admin-editable WhatsApp/email) ──
  await prisma.systemConfig.upsert({
    where: { key: "contact.whatsapp" },
    update: {},
    create: { key: "contact.whatsapp", value: "233200000000", group: "contact", label: "WhatsApp number" },
  });
  await prisma.systemConfig.upsert({
    where: { key: "contact.email" },
    update: {},
    create: { key: "contact.email", value: "hello@wewash.app", group: "contact", label: "Contact email" },
  });

  console.log(`✅ Seeded hall ${hall.code}, ${rooms.length} rooms, machine ${machine.serialNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
