/**
 * Bootstrap the first SUPER_ADMIN (or add another admin).
 *
 * Usage (with .env loaded):
 *   npx tsx scripts/create-admin.ts admin@wewash.app "StrongPass123!" "Ops Admin"
 *
 * Requires: DATABASE_URL, DIRECT_URL (or same), BETTER_AUTH_SECRET
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const [email, password, nameArg] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    'Usage: npx tsx scripts/create-admin.ts <email> <password> ["Display Name"]'
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const name = nameArg || "WeWash Admin";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.SUPER_ADMIN, isActive: true, name },
    });
    // Ensure credential account exists / refresh password
    const hashed = await hashPassword(password);
    const account = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashed },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: existing.id,
          accountId: existing.id,
          providerId: "credential",
          password: hashed,
        },
      });
    }
    console.log(`Updated existing user to SUPER_ADMIN: ${email}`);
    return;
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      emailVerified: true,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashed,
    },
  });
  console.log(`Created SUPER_ADMIN: ${email} (${user.id})`);
  console.log("Sign in at /admin with this email and password.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
