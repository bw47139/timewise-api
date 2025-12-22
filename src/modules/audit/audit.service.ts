import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createAuditLog({
  action,
  tableName,
  recordId,
  beforeData,
  afterData,
  supervisorId,
  reason
}: {
  action: string;
  tableName: string;
  recordId: number;
  beforeData?: any;
  afterData?: any;
  supervisorId?: number | null;
  reason?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      action,
      tableName,
      recordId,
      beforeData,
      afterData,
      supervisorId,
      reason
    },
  });
}
