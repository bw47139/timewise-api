"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../prisma");
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
/**
 * ======================================================
 * GET /api/punches/employee/:employeeId
 * Returns punch history for a single employee
 * ======================================================
 */
router.get("/:employeeId", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const employeeId = Number(req.params.employeeId);
        if (!employeeId) {
            return res.status(400).json({ error: "Invalid employeeId" });
        }
        const orgId = req.user?.organizationId;
        const punches = await prisma_1.prisma.punch.findMany({
            where: {
                employeeId,
                employee: {
                    organizationId: orgId,
                },
            },
            orderBy: {
                timestamp: "desc",
            },
        });
        res.json(punches);
    }
    catch (err) {
        console.error("❌ Punch history error:", err);
        res.status(500).json({ error: "Failed to load punch history" });
    }
});
exports.default = router;
