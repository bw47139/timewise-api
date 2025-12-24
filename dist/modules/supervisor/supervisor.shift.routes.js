"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Supervisor Edit Punch
 */
router.put("/:id", async (req, res) => {
    try {
        const punchId = Number(req.params.id);
        const { timestamp, supervisorId, reason } = req.body;
        if (!punchId || !timestamp) {
            return res.status(400).json({
                error: "Punch ID and timestamp are required"
            });
        }
        if (!supervisorId) {
            return res.status(400).json({
                error: "supervisorId is required"
            });
        }
        if (!reason) {
            return res.status(400).json({
                error: "reason is required for supervisor override"
            });
        }
        const punch = await prisma.punch.findUnique({
            where: { id: punchId }
        });
        if (!punch) {
            return res.status(404).json({ error: "Punch not found" });
        }
        const updated = await prisma.punch.update({
            where: { id: punchId },
            data: {
                timestamp: new Date(timestamp),
                isSupervisorOverride: true,
                overrideByUserId: supervisorId,
                overrideReason: reason
            }
        });
        // ✅ AUDIT LOG (userId, NOT supervisorId)
        await (0, audit_service_1.createAuditLog)({
            action: "EDIT_PUNCH",
            entityId: updated.id,
            userId: supervisorId,
            beforeData: punch,
            afterData: updated,
            metadata: {
                reason
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error("Supervisor edit punch error:", error);
        res.status(500).json({
            error: "Failed to edit punch"
        });
    }
});
exports.default = router;
