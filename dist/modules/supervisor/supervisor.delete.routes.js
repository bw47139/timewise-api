"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Supervisor Delete Punch
 */
router.delete("/punch/:id", async (req, res) => {
    try {
        const punchId = Number(req.params.id);
        const { supervisorId, reason } = req.body;
        if (!reason) {
            return res.status(400).json({ error: "reason is required" });
        }
        const punch = await prisma.punch.findUnique({
            where: { id: punchId }
        });
        if (!punch) {
            return res.status(404).json({ error: "Punch not found" });
        }
        // Save before-data for audit
        const beforeData = { ...punch };
        await prisma.punch.delete({
            where: { id: punchId }
        });
        await (0, audit_service_1.createAuditLog)({
            action: "DELETE_PUNCH",
            entityId: punchId,
            beforeData,
            userId: supervisorId ?? null, // ✅ FIXED
            reason
        });
        res.json({
            message: "Punch deleted successfully",
            punchId
        });
    }
    catch (error) {
        console.error("Delete punch error:", error);
        res.status(500).json({ error: "Failed to delete punch" });
    }
});
exports.default = router;
