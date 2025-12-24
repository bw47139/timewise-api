"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateLockedForOrg = isDateLockedForOrg;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma_1 = require("../../prisma");
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * Helper: require admin/manager roles
 * ------------------------------------------------------
 */
function requireManagerOrAdmin(req) {
    const user = req.user;
    if (!user || !user.role) {
        const error = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
    }
    const allowed = ["ADMIN", "MANAGER", "OWNER", "SUPERADMIN"];
    if (!allowed.includes(user.role.toUpperCase())) {
        const error = new Error("Forbidden");
        error.statusCode = 403;
        throw error;
    }
    return user;
}
/**
 * ------------------------------------------------------
 * GET /api/payperiod/ping
 * ------------------------------------------------------
 */
router.get("/ping", (_req, res) => {
    res.json({ message: "Pay period routes working" });
});
/**
 * ------------------------------------------------------
 * POST /api/payperiod/generate
 * ------------------------------------------------------
 */
router.post("/generate", verifyToken_1.verifyToken, async (req, res) => {
    try {
        requireManagerOrAdmin(req);
        const monthsAhead = Number(req.query.monthsAhead ?? 3);
        const monthsBack = Number(req.query.monthsBack ?? 1);
        const locations = await prisma_1.prisma.location.findMany({
            select: {
                id: true,
                organizationId: true,
                payPeriodType: true,
                weekStartDay: true,
            },
        });
        const now = new Date();
        const startWindow = new Date(now);
        startWindow.setMonth(startWindow.getMonth() - monthsBack);
        startWindow.setHours(0, 0, 0, 0);
        const endWindow = new Date(now);
        endWindow.setMonth(endWindow.getMonth() + monthsAhead);
        endWindow.setHours(23, 59, 59, 999);
        let createdCount = 0;
        for (const loc of locations) {
            let daysPerPeriod;
            switch (loc.payPeriodType) {
                case client_1.PayPeriodType.BIWEEKLY:
                    daysPerPeriod = 14;
                    break;
                case client_1.PayPeriodType.WEEKLY:
                    daysPerPeriod = 7;
                    break;
                default:
                    // SEMIMONTHLY / MONTHLY are NOT auto-generated
                    continue;
            }
            const weekStartDay = loc.weekStartDay ?? 1;
            let cursor = alignToWeekStart(startWindow, weekStartDay);
            while (cursor <= endWindow) {
                const startDate = new Date(cursor);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + daysPerPeriod - 1);
                endDate.setHours(23, 59, 59, 999);
                try {
                    await prisma_1.prisma.payrollPeriod.create({
                        data: {
                            organizationId: loc.organizationId,
                            locationId: loc.id,
                            startDate,
                            endDate,
                            status: client_1.PayrollPeriodStatus.OPEN,
                        },
                    });
                    createdCount++;
                }
                catch {
                    // ignore duplicates
                }
                cursor.setDate(cursor.getDate() + daysPerPeriod);
            }
        }
        res.json({ createdCount });
    }
    catch (err) {
        res.status(err.statusCode || 500).json({
            error: err.message || "Failed to generate payroll periods",
        });
    }
});
/**
 * ------------------------------------------------------
 * GET /api/payperiod
 * ------------------------------------------------------
 */
router.get("/", verifyToken_1.verifyToken, async (_req, res) => {
    try {
        const rows = await prisma_1.prisma.payrollPeriod.findMany({
            orderBy: { startDate: "desc" },
            take: 50,
        });
        res.json(rows.map((p) => ({
            id: p.id,
            startDate: p.startDate.toISOString().slice(0, 10),
            endDate: p.endDate.toISOString().slice(0, 10),
            status: p.status,
            locationId: p.locationId,
        })));
    }
    catch (err) {
        res.status(500).json({
            error: err.message || "Failed to load payroll periods",
        });
    }
});
/**
 * ------------------------------------------------------
 * GET /api/payperiod/:id
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const period = await prisma_1.prisma.payrollPeriod.findUnique({ where: { id } });
        if (!period) {
            return res.status(404).json({ error: "Payroll period not found" });
        }
        res.json(period);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * ------------------------------------------------------
 * POST /api/payperiod/:id/approve
 * ------------------------------------------------------
 */
router.post("/:id/approve", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const user = requireManagerOrAdmin(req);
        const id = Number(req.params.id);
        const period = await prisma_1.prisma.payrollPeriod.findUnique({ where: { id } });
        if (!period) {
            return res.status(404).json({ error: "Payroll period not found" });
        }
        const updated = await prisma_1.prisma.payrollPeriod.update({
            where: { id },
            data: {
                status: client_1.PayrollPeriodStatus.APPROVED,
                approvedAt: new Date(),
                approvedByUserId: user.id,
            },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});
/**
 * ------------------------------------------------------
 * Helper: date lock check
 * ------------------------------------------------------
 */
async function isDateLockedForOrg(organizationId, locationId, targetDate) {
    const period = await prisma_1.prisma.payrollPeriod.findFirst({
        where: {
            organizationId,
            OR: [
                { locationId: null },
                ...(locationId ? [{ locationId }] : []),
            ],
            startDate: { lte: targetDate },
            endDate: { gte: targetDate },
            status: {
                in: [
                    client_1.PayrollPeriodStatus.APPROVED,
                    client_1.PayrollPeriodStatus.LOCKED,
                ],
            },
        },
    });
    return Boolean(period);
}
/**
 * ------------------------------------------------------
 * Helper: align to week start
 * ------------------------------------------------------
 */
function alignToWeekStart(date, weekStartDay) {
    const d = new Date(date);
    const diff = (d.getDay() - weekStartDay + 7) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
exports.default = router;
