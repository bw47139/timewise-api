"use strict";
// src/modules/audit/audit.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * ------------------------------------------------------
 * JSON-safe serializer
 * ------------------------------------------------------
 * Converts Date objects to ISO strings so metadata
 * always conforms to Prisma JSON input rules.
 */
function serializeForJson(value) {
    return JSON.parse(JSON.stringify(value, (_key, val) => val instanceof Date ? val.toISOString() : val));
}
async function createAuditLog(params) {
    const { action, userId, userEmail, entityType, entityId, method, path, ipAddress, metadata, tableName, recordId, beforeData, afterData, reason, } = params;
    const resolvedEntityType = entityType ?? tableName ?? null;
    const resolvedEntityId = entityId != null
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
    const resolvedMetadata = Object.keys(metadataObj).length > 0
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
