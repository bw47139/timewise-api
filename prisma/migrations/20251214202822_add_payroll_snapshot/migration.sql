-- CreateTable
CREATE TABLE "PayrollSnapshot" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "payPeriodId" INTEGER NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayrollSnapshot_organizationId_payPeriodId_idx" ON "PayrollSnapshot"("organizationId", "payPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSnapshot_organizationId_payPeriodId_key" ON "PayrollSnapshot"("organizationId", "payPeriodId");

-- AddForeignKey
ALTER TABLE "PayrollSnapshot" ADD CONSTRAINT "PayrollSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSnapshot" ADD CONSTRAINT "PayrollSnapshot_payPeriodId_fkey" FOREIGN KEY ("payPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
