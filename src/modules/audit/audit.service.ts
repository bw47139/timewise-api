// src/modules/audit/audit.service.ts

import { PrismaClient, Prisma } from "@prisma/client";
import { AuditAction } from "./audit.actions";

const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * JSON-safe serializer
 * ------------------------------------------------------
 * Converts Date objects to ISO strings so metadata
 * always conforms to Prisma JSON input rules.
 */
function serializeForJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      val instanceof Date ? val.toISOString() : val
    )
  ) as Prisma.InputJsonValue;
}

/**
 * ------------------------------------------------------
 * Canonical Audit Log Writer (HARDENED)
 * ------------------------------------------------------
 */
export interface CreateAuditLogParams {
  action: AuditAction;

  userId?: number | null;
  userEmail?: string | null;

  entityType?: string | null;
  entityId?: string | number | null;

  method?: string | null;
  path?: string | null;
  ipAddress?: string | null;

  metadata?: Prisma.InputJsonValue;

  // legacy
  tableName?: string;
  recordId?: number;
  beforeData?: unknown;
  afterData?: unknown;
  reason?: string | null;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  const {
    action,
    userId,
    userEmail,
    entityType,
    entityId,
    method,
    path,
    ipAddress,
    metadata,
    tableName,
    recordId,
    beforeData,
    afterData,
    reason,
  } = params;

  const resolvedEntityType = entityType ?? tableName ?? null;
  const resolvedEntityId =
    entityId != null
      ? String(entityId)
      : recordId != null
      ? String(recordId)
      : null;

  const metadataObj = {
    ...(typeof metadata === "object" && metadata !== null ? metadata : {}),
    ...(beforeData !== undefined ? { beforeData } : {}),
    ...(afterData !== undefined ? { afterData } : {}),
    ...(reason ? { reason } : {}),
    ...(tableName ? { legacyTableName: tableName } : {}),
    ...(recordId ? { legacyRecordId: recordId } : {}),
  };

  // ✅ Prisma-safe: undefined means “no metadata”
  const resolvedMetadata: Prisma.InputJsonValue | undefined =
    Object.keys(metadataObj).length > 0
      ? serializeForJson(metadataObj)
      : undefined;

  return prisma.auditLog.create({
    data: {
      action,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      entityType: resolvedEntityType,
      entityId: resolvedEntityId,
      method: method ?? null,
      path: path ?? null,
      ipAddress: ipAddress ?? null,
      metadata: resolvedMetadata,
    },
  });
}
