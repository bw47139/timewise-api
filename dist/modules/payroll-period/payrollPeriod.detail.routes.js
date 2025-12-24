"use strict";
// src/modules/payroll-period/payrollPeriod.detail.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * GET /api/payroll-period/:id
 *
 * Returns a single payroll period for the logged-in org
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const payPeriodId = Number(req.params.id);
        const { organizationId } = req.user;
        if (!payPeriodId || Number.isNaN(payPeriodId)) {
            return res.status(400).json({ error: "Invalid payroll period id" });
        }
        const period = await prisma.payrollPeriod.findFirst({
            where: {
                id: payPeriodId,
                organizationId,
            },
            include: {
                location: true,
            },
        });
        if (!period) {
            return res.status(404).json({ error: "Payroll period not found" });
        }
        return res.json(period);
    }
    catch (error) {
        console.error("❌ Failed to load payroll period:", error);
        return res.status(500).json({ error: "Failed to load payroll period" });
    }
});
/**
 * ------------------------------------------------------
 * GET /api/payroll-period/:id/employees
 *
 * Returns employees + hours for this payroll period.
 *
 * Shape:
 * [
 *   {
 *     employeeId,
 *     employeeName,
 *     regular,
 *     overtime,
 *     doubletime,
 *     missingPunch,
 *     punchPairs: [
 *       { in: string, out: string | null, hours: number | null }
 *     ]
 *   }
 * ]
 * ------------------------------------------------------
 */
router.get("/:id/employees", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const payPeriodId = Number(req.params.id);
        const { organizationId } = req.user;
        if (!payPeriodId || Number.isNaN(payPeriodId)) {
            return res.status(400).json({ error: "Invalid payroll period id" });
        }
        const period = await prisma.payrollPeriod.findFirst({
            where: {
                id: payPeriodId,
                organizationId,
            },
            include: {
                location: true,
            },
        });
        if (!period) {
            return res.status(404).json({ error: "Payroll period not found" });
        }
        const start = period.startDate;
        const end = period.endDate;
        const locationId = period.locationId;
        if (!locationId) {
            return res
                .status(400)
                .json({ error: "Payroll period has no associated location" });
        }
        const punches = await prisma.punch.findMany({
            where: {
                locationId,
                timestamp: {
                    gte: start,
                    lte: (0, dayjs_1.default)(end).endOf("day").toDate(),
                },
                employee: {
                    organizationId,
                    isDeleted: false,
                    status: client_1.EmployeeStatus.ACTIVE,
                },
            },
            include: {
                employee: true,
            },
            orderBy: {
                timestamp: "asc",
            },
        });
        // Group by employeeId
        const grouped = {};
        for (const p of punches) {
            if (!grouped[p.employeeId])
                grouped[p.employeeId] = [];
            grouped[p.employeeId].push(p);
        }
        const results = Object.keys(grouped).map((key) => {
            const employeeId = Number(key);
            const rows = grouped[employeeId];
            const emp = rows[0].employee;
            let regular = 0;
            let overtime = 0;
            let doubletime = 0;
            let missingPunch = false;
            const punchPairs = [];
            for (let i = 0; i < rows.length; i += 2) {
                const inPunch = rows[i];
                const outPunch = rows[i + 1];
                if (!outPunch) {
                    // Missing OUT punch
                    missingPunch = true;
                    punchPairs.push({
                        in: inPunch.timestamp.toISOString(),
                        out: null,
                        hours: null,
                    });
                    continue;
                }
                const hours = (0, dayjs_1.default)(outPunch.timestamp).diff(inPunch.timestamp, "minute") / 60;
                punchPairs.push({
                    in: inPunch.timestamp.toISOString(),
                    out: outPunch.timestamp.toISOString(),
                    hours: Number(hours.toFixed(2)),
                });
                // Simple OT/DT logic (same as summary)
                if (hours > 12) {
                    doubletime += hours - 12;
                    overtime += 4; // 8–12
                    regular += 8;
                }
                else if (hours > 8) {
                    overtime += hours - 8;
                    regular += 8;
                }
                else {
                    regular += hours;
                }
            }
            return {
                employeeId,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                regular: Number(regular.toFixed(2)),
                overtime: Number(overtime.toFixed(2)),
                doubletime: Number(doubletime.toFixed(2)),
                missingPunch,
                punchPairs,
            };
        });
        return res.json(results);
    }
    catch (error) {
        console.error("❌ Failed to load payroll period employees:", error);
        return res
            .status(500)
            .json({ error: "Failed to load payroll period employees" });
    }
});
/**
 * ------------------------------------------------------
 * GET /api/payroll-period/:id/employees/:employeeId/punches
 *
 * Raw punches for a single employee in this period.
 * ------------------------------------------------------
 */
router.get("/:id/employees/:employeeId/punches", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const payPeriodId = Number(req.params.id);
        const employeeId = Number(req.params.employeeId);
        const { organizationId } = req.user;
        if (!payPeriodId || !employeeId) {
            return res.status(400).json({ error: "Invalid ids" });
        }
        const period = await prisma.payrollPeriod.findFirst({
            where: {
                id: payPeriodId,
                organizationId,
            },
        });
        if (!period) {
            return res.status(404).json({ error: "Payroll period not found" });
        }
        const punches = await prisma.punch.findMany({
            where: {
                employeeId,
                locationId: period.locationId ?? undefined,
                timestamp: {
                    gte: period.startDate,
                    lte: (0, dayjs_1.default)(period.endDate).endOf("day").toDate(),
                },
                employee: {
                    organizationId,
                },
            },
            orderBy: { timestamp: "asc" },
        });
        return res.json(punches);
    }
    catch (error) {
        console.error("❌ Failed to load punches for employee:", error);
        return res
            .status(500)
            .json({ error: "Failed to load punches for employee" });
    }
});
/**
 * ------------------------------------------------------
 * POST /api/payroll-period/:id/pdf-summary
 *
 * Placeholder for future PDF export. For now, returns 501.
 * (We can wire this into your existing PDF/S3 system later.)
 * ------------------------------------------------------
 */
router.post("/:id/pdf-summary", verifyToken_1.verifyToken, async (_req, res) => {
    return res
        .status(501)
        .json({ error: "PDF summary export not implemented yet" });
});
exports.default = router;
