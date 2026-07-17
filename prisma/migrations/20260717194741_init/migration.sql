-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "FaultSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FaultStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "TransferReason" AS ENUM ('RELOCATION', 'MAINTENANCE', 'DECOMMISSION', 'REPLACEMENT', 'REBALANCING', 'OTHER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "WashSessionStatus" AS ENUM ('IN_USE', 'RETURNED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DayTransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halls" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "block" TEXT,
    "floor" INTEGER,
    "section" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "hallId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "indexNumber" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "roomId" TEXT,
    "userId" TEXT,
    "weeklyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "profileImageUrl" TEXT,
    "documentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "name" TEXT,
    "code" TEXT,
    "qrToken" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "capacityKg" DOUBLE PRECISION,
    "machineType" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "installationDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "hallId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_schedules" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_sessions" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT,
    "scheduleId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedStartAt" TIMESTAMP(3) NOT NULL,
    "dueBackAt" TIMESTAMP(3) NOT NULL,
    "minutesLate" INTEGER,
    "endedAt" TIMESTAMP(3),
    "status" "WashSessionStatus" NOT NULL DEFAULT 'IN_USE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contractId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "amountDue" DECIMAL(10,2),
    "amountPaid" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "momoTransactionId" TEXT,
    "description" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "receiptUrl" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "terms" TEXT,
    "documentUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "terminationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fault_reports" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FaultSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "FaultStatus" NOT NULL DEFAULT 'REPORTED',
    "imageUrls" TEXT[],
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fault_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "cost" DECIMAL(10,2),
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_logs" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "fromHallId" TEXT,
    "fromRoomInfo" TEXT,
    "toHallId" TEXT,
    "toRoomInfo" TEXT,
    "reason" "TransferReason" NOT NULL,
    "notes" TEXT,
    "transferredBy" TEXT,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'arkesel',
    "providerId" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiting_lists" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hallId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiting_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_transfer_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "fromDay" "DayOfWeek" NOT NULL,
    "toDay" "DayOfWeek",
    "swapRoomId" TEXT,
    "reason" TEXT,
    "status" "DayTransferStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "accounts_providerId_accountId_idx" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "halls_name_key" ON "halls"("name");

-- CreateIndex
CREATE UNIQUE INDEX "halls_code_key" ON "halls"("code");

-- CreateIndex
CREATE INDEX "halls_name_idx" ON "halls"("name");

-- CreateIndex
CREATE INDEX "halls_code_idx" ON "halls"("code");

-- CreateIndex
CREATE INDEX "halls_deletedAt_idx" ON "halls"("deletedAt");

-- CreateIndex
CREATE INDEX "rooms_hallId_idx" ON "rooms"("hallId");

-- CreateIndex
CREATE INDEX "rooms_deletedAt_idx" ON "rooms"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hallId_number_key" ON "rooms"("hallId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentId_key" ON "students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_studentId_idx" ON "students"("studentId");

-- CreateIndex
CREATE INDEX "students_roomId_idx" ON "students"("roomId");

-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE INDEX "students_deletedAt_idx" ON "students"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "machines_serialNumber_key" ON "machines"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "machines_qrToken_key" ON "machines"("qrToken");

-- CreateIndex
CREATE INDEX "machines_serialNumber_idx" ON "machines"("serialNumber");

-- CreateIndex
CREATE INDEX "machines_qrToken_idx" ON "machines"("qrToken");

-- CreateIndex
CREATE INDEX "machines_status_idx" ON "machines"("status");

-- CreateIndex
CREATE INDEX "machines_hallId_idx" ON "machines"("hallId");

-- CreateIndex
CREATE INDEX "machines_deletedAt_idx" ON "machines"("deletedAt");

-- CreateIndex
CREATE INDEX "machine_schedules_machineId_idx" ON "machine_schedules"("machineId");

-- CreateIndex
CREATE INDEX "machine_schedules_roomId_idx" ON "machine_schedules"("roomId");

-- CreateIndex
CREATE INDEX "machine_schedules_dayOfWeek_idx" ON "machine_schedules"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "machine_schedules_machineId_dayOfWeek_key" ON "machine_schedules"("machineId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "machine_schedules_roomId_dayOfWeek_key" ON "machine_schedules"("roomId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "wash_sessions_machineId_idx" ON "wash_sessions"("machineId");

-- CreateIndex
CREATE INDEX "wash_sessions_roomId_idx" ON "wash_sessions"("roomId");

-- CreateIndex
CREATE INDEX "wash_sessions_studentId_idx" ON "wash_sessions"("studentId");

-- CreateIndex
CREATE INDEX "wash_sessions_status_idx" ON "wash_sessions"("status");

-- CreateIndex
CREATE INDEX "wash_sessions_scannedAt_idx" ON "wash_sessions"("scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "payments_contractId_idx" ON "payments"("contractId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE INDEX "payments_dueDate_idx" ON "payments"("dueDate");

-- CreateIndex
CREATE INDEX "payments_deletedAt_idx" ON "payments"("deletedAt");

-- CreateIndex
CREATE INDEX "contracts_studentId_idx" ON "contracts"("studentId");

-- CreateIndex
CREATE INDEX "contracts_machineId_idx" ON "contracts"("machineId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE INDEX "contracts_deletedAt_idx" ON "contracts"("deletedAt");

-- CreateIndex
CREATE INDEX "fault_reports_machineId_idx" ON "fault_reports"("machineId");

-- CreateIndex
CREATE INDEX "fault_reports_reportedById_idx" ON "fault_reports"("reportedById");

-- CreateIndex
CREATE INDEX "fault_reports_status_idx" ON "fault_reports"("status");

-- CreateIndex
CREATE INDEX "fault_reports_severity_idx" ON "fault_reports"("severity");

-- CreateIndex
CREATE INDEX "fault_reports_deletedAt_idx" ON "fault_reports"("deletedAt");

-- CreateIndex
CREATE INDEX "maintenance_logs_machineId_idx" ON "maintenance_logs"("machineId");

-- CreateIndex
CREATE INDEX "maintenance_logs_scheduledDate_idx" ON "maintenance_logs"("scheduledDate");

-- CreateIndex
CREATE INDEX "maintenance_logs_nextDueDate_idx" ON "maintenance_logs"("nextDueDate");

-- CreateIndex
CREATE INDEX "transfer_logs_machineId_idx" ON "transfer_logs"("machineId");

-- CreateIndex
CREATE INDEX "transfer_logs_transferredAt_idx" ON "transfer_logs"("transferredAt");

-- CreateIndex
CREATE INDEX "notification_logs_recipient_idx" ON "notification_logs"("recipient");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "notification_logs_provider_idx" ON "notification_logs"("provider");

-- CreateIndex
CREATE INDEX "notification_logs_nextRetryAt_idx" ON "notification_logs"("nextRetryAt");

-- CreateIndex
CREATE INDEX "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "waiting_lists_studentId_idx" ON "waiting_lists"("studentId");

-- CreateIndex
CREATE INDEX "waiting_lists_isActive_idx" ON "waiting_lists"("isActive");

-- CreateIndex
CREATE INDEX "waiting_lists_priority_idx" ON "waiting_lists"("priority");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "day_transfer_requests_studentId_idx" ON "day_transfer_requests"("studentId");

-- CreateIndex
CREATE INDEX "day_transfer_requests_machineId_idx" ON "day_transfer_requests"("machineId");

-- CreateIndex
CREATE INDEX "day_transfer_requests_status_idx" ON "day_transfer_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_group_idx" ON "system_configs"("group");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_schedules" ADD CONSTRAINT "machine_schedules_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_schedules" ADD CONSTRAINT "machine_schedules_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_sessions" ADD CONSTRAINT "wash_sessions_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_sessions" ADD CONSTRAINT "wash_sessions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_sessions" ADD CONSTRAINT "wash_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_logs" ADD CONSTRAINT "transfer_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_lists" ADD CONSTRAINT "waiting_lists_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
