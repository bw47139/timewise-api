// src/modules/audit/audit.service.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * Canonical Audit Log Writer
 * ------------------------------------------------------
 *
 * Prisma AuditLog model fields:
 * - userId
 * - userEmail
 * - action
 * - entityType
 * - entityId
 * - method
 * - path
 * - ipAddress
 * - metadata
 * - createdAt
 *
 * Any legacy or extra fields are safely stored in metadata.
 */
export async function createAuditLog(params: {
  action: string;

  // Actor
  userId?: number | null;
  userEmail?: string | null;

  // Entity being acted on
  entityType?: string | null;
  entityId?: string | number | null;

  // Request context
  method?: string | null;
  path?: string | null;
  ipAddress?: string | null;

  // Legacy / extra info (safe to pass)
  tableName?: string;
  recordId?: number;
  beforeData?: any;
  afterData?: any;
  reason?: string | null;

  // Any additional metadata
  metadata?: Record<string, any>;
}) {
  const {
    action,
    userId,
    userEmail,
    entityType,
    entityId,
    method,
    path,
    ipAddress,
    tableName,
    recordId,
    beforeData,
    afterData,
    reason,
    metadata,
  } = params;

  return prisma.auditLog.create({
    data: {
      action,

      userId: userId ?? null,
      userEmail: userEmail ?? null,

      entityType: entityType ?? tableName ?? null,
      entityId:
        entityId != null
          ? String(entityId)
          : recordId != null
          ? String(recordId)
          : null,

      method: method ?? null,
      path: path ?? null,
      ipAddress: ipAddress ?? null,

      metadata: {
        ...(metadata ?? {}),
        beforeData,
        afterData,
        reason,
      },
    },
  });
}
