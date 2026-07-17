# WeWash

Next.js washing-machine rotation and subscription platform (admin + student portals).

## Getting started

```bash
npm install
cp .env.example .env   # fill in secrets
npx prisma generate
npx prisma db push     # sync schema to your database (when needed)
npm run auth:create-admin -- admin@wewash.app "YourPassword1" "Admin"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env

See [`.env.example`](./.env.example). Important:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Neon, etc. — not localhost on Vercel) |
| `REDIS_URL` | Redis (`rediss://…` for Upstash) |
| `BETTER_AUTH_SECRET` | Auth signing secret (16+ chars) |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Public app URL |
| `ARKESEL_API_KEY` | SMS / OTP |

### Database

Schema is managed with Prisma. Apply schema changes manually when needed:

```bash
npx prisma generate
npx prisma db push
```

There is **no** seed script and **no** migrate/postinstall hook in npm scripts. Deploy is a normal Next.js build (`next build`).

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Next.js |
| `npm run build` | `next build` |
| `npm run start` | Production server |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | Push schema to DB |
| `npm run db:studio` | Prisma Studio |
| `npm run auth:create-admin` | Create SUPER_ADMIN login |

### Deploy on Vercel

1. Import the GitHub repo.
2. Set env vars from `.env.example` (use cloud Postgres + Redis URLs).
3. Build command: `next build` (default).
4. Run `npx prisma db push` (or migrate) against production once when schema changes — not on every install.
