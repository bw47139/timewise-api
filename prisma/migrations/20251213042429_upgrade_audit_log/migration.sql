/*
  Warnings:

  - You are about to drop the column `afterData` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `beforeData` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `recordId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `tableName` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `AuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "afterData",
DROP COLUMN "beforeData",
DROP COLUMN "reason",
DROP COLUMN "recordId",
DROP COLUMN "supervisorId",
DROP COLUMN "tableName",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
