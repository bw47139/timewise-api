-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'USA',
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT;
