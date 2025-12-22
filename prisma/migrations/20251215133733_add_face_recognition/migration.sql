-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "faceEmbedding" TEXT,
ADD COLUMN     "faceEnabled" BOOLEAN NOT NULL DEFAULT false;
