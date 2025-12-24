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
router.put("/punch/:id", async (req, res) => {
    try {
        const punchId = Number(req.params.id);
        const { timestamp, type, locationId, supervisorId, reason } = req.body;
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
        // SAVE OLD DATA FOR AUDIT LOG
        const beforeData = { ...punch };
        const updatedPunch = await prisma.punch.update({
            where: { id: punchId },
            data: {
                timestamp: timestamp ? new Date(timestamp) : punch.timestamp,
                type: type ?? punch.type,
                locationId: locationId ?? punch.locationId,
                isSupervisorOverride: true,
                overrideByUserId: supervisorId ?? null,
                overrideReason: reason
            }
        });
        // SAVE NEW DATA FOR AUDIT LOG
        const afterData = { ...updatedPunch };
        await (0, audit_service_1.createAuditLog)({
            action: "EDIT_PUNCH",
            entityId: punchId,
            beforeData,
            afterData,
            userId: supervisorId ?? null, // ✅ FIXED
            reason
        });
        res.json({
            message: "Punch updated successfully",
            punch: updatedPunch
        });
    }
    catch (error) {
        console.error("Supervisor punch edit error:", error);
        res.status(500).json({ error: "Failed to edit punch" });
    }
});
exports.default = router;
