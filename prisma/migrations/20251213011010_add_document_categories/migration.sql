-- AlterTable
ALTER TABLE "EmployeeDocument" ADD COLUMN     "categoryId" INTEGER;

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredForEmployees" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
