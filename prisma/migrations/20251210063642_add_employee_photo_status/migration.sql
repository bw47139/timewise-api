-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "email" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';
