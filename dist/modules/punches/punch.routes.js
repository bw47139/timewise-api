"use strict";
// src/modules/punch/punch.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const audit_service_1 = require("../audit/audit.service");
const audit_actions_1 = require("../audit/audit.actions");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * -------------------------------------------------------
 * POST /api/punches/add
 * Add a new IN or OUT punch
 * -------------------------------------------------------
 * Required body:
 * {
 *   "employeeId": 5,
 *   "locationId": 1,
 *   "type": "IN" | "OUT",
 *   "timestamp": "2025-01-01T09:00:00"
 * }
 */
router.post("/add", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const { employeeId, locationId, type, timestamp } = req.body;
        if (!employeeId || !locationId || !type || !timestamp) {
            return res.status(400).json({ error: "Missing fields" });
        }
        if (type !== "IN" && type !== "OUT") {
            return res.status(400).json({ error: "type must be 'IN' or 'OUT'" });
        }
        const punch = await prisma.punch.create({
            data: {
                employeeId: Number(employeeId),
                locationId: Number(locationId),
                type,
                timestamp: new Date(timestamp),
            },
        });
        /**
         * ✅ Typed audit log (SAFE)
         */
        await (0, audit_service_1.createAuditLog)({
            action: audit_actions_1.AuditActions.CREATE_PUNCH,
            entityType: "Punch",
            entityId: punch.id,
            userId: req.user?.id ?? null,
            userEmail: req.user?.email ?? null,
            method: req.method,
            path: req.originalUrl,
            ipAddress: req.ip,
            metadata: {
                punch,
            },
        });
        return res.json({ success: true, punch });
    }
    catch (error) {
        console.error("ADD PUNCH ERROR:", error);
        return res.status(500).json({ error: "Failed to add punch" });
    }
});
/**
 * -------------------------------------------------------
 * DELETE /api/punches/:id
 * Delete a punch entry
 * -------------------------------------------------------
 */
router.delete("/:id", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.punch.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: "Punch not found" });
        }
        await prisma.punch.delete({ where: { id } });
        /**
         * ✅ Typed audit log (SAFE)
         */
        await (0, audit_service_1.createAuditLog)({
            action: audit_actions_1.AuditActions.DELETE_PUNCH,
            entityType: "Punch",
            entityId: id,
            userId: req.user?.id ?? null,
            userEmail: req.user?.email ?? null,
            method: req.method,
            path: req.originalUrl,
            ipAddress: req.ip,
            metadata: {
                beforeData: existing,
            },
        });
        return res.json({ success: true });
    }
    catch (error) {
        console.error("DELETE PUNCH ERROR:", error);
        return res.status(500).json({ error: "Failed to delete punch" });
    }
});
exports.default = router;
