"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const payperiod_service_1 = require("../timecard/payperiod.service");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * ----------------------------------------------------------
 * GET /api/payperiod-report/payperiod?date=YYYY-MM-DD
 * ----------------------------------------------------------
 */
router.get("/", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                error: "date query param is required (YYYY-MM-DD)",
            });
        }
        const refDate = new Date(String(date));
        if (isNaN(refDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }
        // TEMP: single-tenant (first org)
        const org = await prisma.organization.findFirst({
            select: { id: true },
        });
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        // ✅ CORRECT CALL SIGNATURE
        const payPeriod = await (0, payperiod_service_1.getPayPeriodForDate)(org.id, refDate);
        return res.json(payPeriod);
    }
    catch (err) {
        console.error("Pay period report error:", err);
        return res
            .status(500)
            .json({ error: "Failed to resolve pay period" });
    }
});
exports.default = router;
