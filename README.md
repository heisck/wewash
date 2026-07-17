# WeWash

Next.js washing-machine rotation and subscription platform (admin + student portals).

## Getting started

```bash
npm install
cp .env.example .env   # if present — set DATABASE_URL + DIRECT_URL
npm run db:deploy      # apply migrations (or db:migrate for local iterative work)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (pooled OK for app) |
| `DIRECT_URL` | Direct Postgres URL for Prisma migrations |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | Auth |
| Other keys | See app config / hosting dashboard |

## Database (Prisma)

Migrations live in `prisma/migrations/`.

| Script | When |
|--------|------|
| `npm run postinstall` | Runs `prisma generate` after install (also on Vercel) |
| `npm run build` | `prisma generate` → **`prisma migrate deploy`** → `next build` |
| `npm run db:migrate` | Local: create/apply new migrations (`migrate dev`) |
| `npm run db:deploy` | Apply pending migrations only (CI/prod-safe) |
| `npm run db:push` | Push schema without migration history (prototyping only) |
| `npm run db:status` | Show migration status |

### What happens on GitHub → Vercel deploy

1. You push code (including `prisma/schema.prisma` + `prisma/migrations/**`).
2. Vercel runs `npm install` → **`prisma generate`** (`postinstall`).
3. Vercel runs **`npm run build`** → **`prisma migrate deploy`** applies any new migrations to the production DB, then builds Next.js.

So: **yes, after this setup, a successful production build applies pending migrations** — as long as `DATABASE_URL` and `DIRECT_URL` are set in the Vercel project env.

### Existing database already created with `db push`

If production already has tables but **no** `_prisma_migrations` history, the first deploy may fail with “relation already exists”. Baseline once:

```bash
# Against the production DB (with env loaded):
npx prisma migrate resolve --applied 20260717194741_init
```

Then future migrations deploy normally. If the live schema is *behind* this init migration (missing new columns), prefer aligning with:

```bash
npx prisma db push
npx prisma migrate resolve --applied 20260717194741_init
```

### Adding schema changes later

```bash
# Edit prisma/schema.prisma, then:
npm run db:migrate -- --name describe_your_change
git add prisma/schema.prisma prisma/migrations
git commit -m "db: add ..."
git push   # Vercel will migrate deploy on build
```

## Deploy on Vercel

1. Import the GitHub repo.
2. Set `DATABASE_URL`, `DIRECT_URL`, and auth secrets.
3. Deploy — build runs migrate + Next.js automatically.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
