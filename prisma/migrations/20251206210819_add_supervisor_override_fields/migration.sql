-- AlterTable
ALTER TABLE "Punch" ADD COLUMN     "isSupervisorOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overrideByUserId" INTEGER,
ADD COLUMN     "overrideReason" TEXT;
