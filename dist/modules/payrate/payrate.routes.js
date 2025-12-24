"use strict";
// src/modules/payrate/payrate.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * GET /api/payrate
 * List all pay rates (admin/debug use)
 */
router.get("/", verifyToken_1.verifyToken, async (_req, res) => {
    const rates = await prisma.payRate.findMany({
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: [
            { employeeId: "asc" },
            { effectiveDate: "desc" },
        ],
    });
    res.json(rates);
});
/**
 * POST /api/payrate
 * Create new pay rate
 */
router.post("/", verifyToken_1.verifyToken, async (req, res) => {
    const { employeeId, rate, effectiveDate } = req.body;
    if (!employeeId || !rate || !effectiveDate) {
        return res.status(400).json({
            error: "employeeId, rate, effectiveDate required",
        });
    }
    const created = await prisma.payRate.create({
        data: {
            employeeId,
            rate,
            effectiveDate: new Date(effectiveDate),
        },
    });
    res.json(created);
});
exports.default = router;
