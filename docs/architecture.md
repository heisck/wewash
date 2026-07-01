# WeWash — Architecture Reference

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│   Admin Dashboard (Next.js)    Student Portal (Next.js)         │
└──────────────────┬──────────────────────┬───────────────────────┘
                   │        HTTPS         │
┌──────────────────▼──────────────────────▼───────────────────────┐
│                    Next.js App Router                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Middleware   │  │ API Routes   │  │ Server Components      │  │
│  │ (auth,rate)  │  │ /api/v1/*    │  │ (SSR pages)            │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────────────┘  │
│         │                │                                       │
│  ┌──────▼────────────────▼───────────────────────────────────┐  │
│  │                   SERVICE LAYER                            │  │
│  │  student.service │ machine.service │ payment.service │ ... │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│         │                │                                       │
│  ┌──────▼────────────────▼───────────────────────────────────┐  │
│  │                 REPOSITORY LAYER                           │  │
│  │  student.repo │ machine.repo │ payment.repo │ ...          │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼──────┐  ┌───────▼──────┐
│  PostgreSQL   │  │    Redis     │  │   Arkesel    │
│  (Prisma)     │  │  (Cache/     │  │   SMS API    │
│               │  │   BullMQ)    │  │              │
└───────────────┘  └──────────────┘  └──────────────┘
```

## Layer Responsibilities

### API Layer (`src/app/api/v1/`)
- HTTP request/response handling
- Input validation (Zod schemas)
- Authentication/authorization checks
- Rate limiting
- Response formatting
- **NO business logic here**

### Service Layer (`src/lib/services/`)
- All business logic and rules
- Orchestrates multiple repositories
- Triggers notifications
- Handles transactions
- Audit logging
- **NO direct Prisma calls here**

### Repository Layer (`src/lib/repositories/`)
- Data access only (Prisma queries)
- Pagination, filtering, sorting
- Soft delete awareness (`where: { deletedAt: null }`)
- **NO business logic here**

### Integration Layer (`src/lib/integrations/`)
- External API clients (Arkesel, Cloudinary)
- Retry logic, timeouts, error mapping
- **Isolated from business logic**

## Machine Rotation Model

```
Machine M1 → Rotates daily across Rooms R1-R7

Day       │ Room │ Time Window
──────────┼──────┼──────────────────
Monday    │ R1   │ 08:00 → 08:00+1
Tuesday   │ R2   │ 08:00 → 08:00+1
Wednesday │ R3   │ 08:00 → 08:00+1
Thursday  │ R4   │ 08:00 → 08:00+1
Friday    │ R5   │ 08:00 → 08:00+1
Saturday  │ R6   │ 08:00 → 08:00+1
Sunday    │ R7   │ 08:00 → 08:00+1

Admin configures:
- Which machine serves which rooms
- What time each day the rotation happens
- The order of rooms in the rotation
```

## Data Flow: SMS Notification

```
Service calls NotificationService.sendSMS()
  → Validates phone number (Ghana +233 format)
  → Creates NotificationLog (status: QUEUED)
  → Pushes to BullMQ SMS queue
  → Worker picks up job
  → Calls Arkesel API v2
  → On success: Updates log (status: SENT)
  → On failure: Retries with exponential backoff
  → After max retries: Updates log (status: FAILED)
```

## Auth Flow

```
1. Email + Password → Better Auth credential provider
2. Phone OTP → Arkesel OTP API → Better Auth custom provider
3. Google OAuth → Better Auth Google provider
```

## API Response Format

Every API response follows this shape:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;       // "VALIDATION_ERROR", "NOT_FOUND", etc.
    message: string;    // Human-readable message
    details?: unknown;  // Field-level errors for validation
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```
