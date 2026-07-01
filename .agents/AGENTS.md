# WeWash — Agent Guidelines

This is a production-ready washing machine management system for universities.
Follow these rules when contributing to this codebase.

## Project Overview

WeWash manages washing machines shared across university halls. Each machine
rotates across up to 7 rooms on a configurable daily schedule. The system handles
student management, payments, fault reporting, SMS/email notifications, and analytics.

## Architecture

- **Pattern**: Clean Architecture with Repository → Service → API layers
- **Framework**: Next.js 15 (App Router) + TypeScript strict
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (rate limiting, session cache, query cache)
- **SMS**: Arkesel API v2 (Ghana-based SMS gateway)
- **Auth**: Better Auth (email + phone OTP + Google OAuth)
- **Jobs**: BullMQ (Redis-backed background workers)
- **Validation**: Zod schemas for all inputs

## File Locations

### Backend (Priority — build this first)

| What | Where |
|---|---|
| Database schema | `prisma/schema.prisma` |
| DB client singleton | `src/lib/db/prisma.ts` |
| Redis client | `src/lib/db/redis.ts` |
| Environment config | `src/lib/config/env.ts` |
| Constants | `src/lib/config/constants.ts` |
| Zod validators | `src/lib/validators/*.ts` |
| Repository layer | `src/lib/repositories/*.repository.ts` |
| Service layer | `src/lib/services/*.service.ts` |
| API routes | `src/app/api/v1/<entity>/route.ts` |
| Auth config | `src/lib/auth/config.ts` |
| RBAC permissions | `src/lib/auth/permissions.ts` |
| Arkesel SMS client | `src/lib/integrations/arkesel/client.ts` |
| Background jobs | `src/lib/jobs/` |
| Error handling | `src/lib/errors/` |
| Logger | `src/lib/logger/index.ts` |
| Middleware | `src/lib/middleware/` |
| Utilities | `src/lib/utils/` |
| Type definitions | `src/lib/types/` |

### Frontend (User provides components)

| What | Where |
|---|---|
| Pages (App Router) | `src/app/(dashboard)/` and `src/app/(auth)/` |
| Shared components | `src/components/` |
| React hooks | `src/hooks/` |
| Global styles | `src/styles/` |

## Coding Standards

1. **TypeScript strict mode** — No `any` types unless absolutely necessary
2. **Zod validation** — Every API input must be validated with Zod
3. **Repository pattern** — Never call Prisma directly from services or routes
4. **Service layer** — All business logic lives in services, not in routes
5. **Consistent API responses** — Always use `ApiResponse` helper:
   ```typescript
   { success: boolean, data?: T, error?: { code: string, message: string }, meta?: { page, limit, total } }
   ```
6. **Error codes** — Use defined error codes from `src/lib/errors/error-codes.ts`
7. **Audit logging** — Log all mutations (create/update/delete) via `AuditLog`
8. **Soft deletes** — Use `deletedAt` field, never hard delete production data
9. **Phone numbers** — Always normalize to `+233XXXXXXXXX` format
10. **Naming conventions**:
    - Files: `kebab-case.ts`
    - Classes/Types: `PascalCase`
    - Functions/variables: `camelCase`
    - Constants: `UPPER_SNAKE_CASE`
    - DB tables: `snake_case` (via Prisma `@@map`)

## Rate Limiting

All API routes must respect rate limits defined in `src/lib/middleware/rate-limit.middleware.ts`.
Rate limits are enforced via Redis with sliding window algorithm.

| Endpoint Category | Limit |
|---|---|
| Auth (login/register) | 5 req/min |
| OTP send | 3 req/min |
| Read operations | 100 req/min |
| Write operations | 30 req/min |
| Bulk operations | 10 req/min |
| File uploads | 20 req/min |

## Retry Policy

External API calls (Arkesel SMS, Cloudinary) must use exponential backoff:
- Max retries: 3
- Initial delay: 1000ms
- Backoff multiplier: 2x
- Max delay: 10000ms
- Timeout per request: 15000ms

## Testing

- Unit tests: `tests/unit/` — use Vitest
- Integration tests: `tests/integration/`
- Mock Arkesel in tests (never send real SMS in tests)

## Key Business Rules

1. **Machine rotation**: 1 machine serves up to 7 rooms. Each day at a configured
   time, the machine "belongs" to a different room. Admin configures the schedule.
2. **Payments**: Manually recorded by admin (amount, method, date). No gateway integration yet.
3. **Fault reports**: Students report faults → Admin acknowledges → Resolution tracked.
4. **Notifications**: SMS via Arkesel, email via SMTP. All logged in `notification_logs`.
5. **Contracts**: Students sign contracts for machine access (start/end date, monthly amount).

## 🎯 Core Identity
You are an **experienced senior software engineer** who writes **minimal, optimized, production-ready code**. You do NOT write bloat, junior-level verbose code, or unnecessary lines. Every line must earn its place.

---

## ⚠️ CRITICAL RULES — NEVER VIOLATE

### 1. NO BLOATED CODE
- **Functions must be under 50 lines** unless absolutely necessary
- **Files should not exceed 300 lines** — split into atomic modules if larger
- **If code can be 100 lines, write it in 30-40** using proper abstractions
- NEVER write 200+ lines when 100 would suffice — that's junior behavior
- **Search the codebase BEFORE creating new utilities** to avoid duplicates [ ForgeCode:2025]

### 2. PRESERVE ORTHOGONAL CODE
- **NEVER delete, remove, or modify code that is NOT directly related** to the current task
- If you see code you "don't understand" or "don't like" — **DO NOT TOUCH IT**
- Only modify files/functions explicitly mentioned in the task or directly dependent on them
- **When in doubt, ASK before removing anything** [ForgeCode:2025]

### 3. OPTIMIZE FOR COMPILER/INTERPRETER EFFICIENCY
- **No unnecessary imports, variables, or calculations**
- **Use early returns** to reduce nesting depth
- **Prefer const/let over redundant declarations**
- **Avoid redundant API calls, database queries, or file reads**
- For backend: **no N+1 queries, proper indexing, connection pooling**
- For frontend: **memoize expensive computations, avoid re-renders**

### 4. CLEAN UP AFTER LOGIC CHANGES
- When refactoring or changing logic: **remove dead code, unused imports, obsolete comments**
- **Search for references** before deleting anything
- Run linter/type-checker after changes: fix ALL warnings
- **No commented-out code** — use git for history

### 5. NEVER ASSUME — VERIFY FIRST
- **Before suggesting libraries/functions, verify they exist** in the codebase or are current (not outdated training data)
- **Check official documentation** for latest APIs (use Context7 MCP or similar for live docs) [ForgeCode:2025]
- **If unsure about something critical, ASK** rather than hallucinate
- **Cross-reference with at least 2 sources** for non-trivial implementations

### 6. CONTEXT MANAGEMENT — NO MID-SESSION AMNESIA
- **Maintain explicit context** of what we're building — reference previous decisions
- **After major changes, summarize what changed** and why
- **If context grows large, suggest breaking into smaller tasks**
- **Always re-index project after major refactors** to avoid hallucinations [ForgeCode:2025]

### 7. STEP-BY-STEP REASONING BEFORE CODE
