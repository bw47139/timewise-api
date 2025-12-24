"use strict";
// src/modules/payperiod-report/payrollSummary.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const payrollSummary_service_1 = require("./payrollSummary.service");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * ==========================================================
 * AUTO-LOADED PATH STRUCTURE
 * ==========================================================
 *
 * File: payrollSummary.routes.ts
 * Mounted at: /api/payperiod-report/payroll
 *
 * FINAL ENDPOINT:
 *   GET /api/payperiod-report/payroll/summary?payPeriodId=123
 *
 * ==========================================================
 */
router.get("/summary", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const { payPeriodId } = req.query;
        // --------------------------------------------------
        // Validate input
        // --------------------------------------------------
        if (!payPeriodId || isNaN(Number(payPeriodId))) {
            return res.status(400).json({
                error: "payPeriodId query param is required",
            });
        }
        // --------------------------------------------------
        // Load payroll period
        // --------------------------------------------------
        const period = await prisma.payrollPeriod.findUnique({
            where: { id: Number(payPeriodId) },
        });
        if (!period) {
            return res.status(404).json({
                error: "Payroll period not found",
            });
        }
        // --------------------------------------------------
        // TEMP: Single-tenant mode
        // Later orgId will come from JWT
        // --------------------------------------------------
        const organizationId = period.organizationId;
        // --------------------------------------------------
        // Generate payroll summary
        // --------------------------------------------------
        const summary = await (0, payrollSummary_service_1.generatePayrollSummary)(organizationId, period);
        return res.json(summary);
    }
    catch (err) {
        console.error("❌ Payroll summary error:", err);
        return res.status(500).json({
            error: "Failed to generate payroll summary",
        });
    }
});
exports.default = router;
