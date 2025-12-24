"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * GET ACTIVITY LOG FOR EMPLOYEE
 * GET /api/employees/:id/activity
 */
router.get("/:id/activity", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const [items, total] = await Promise.all([
            prisma.employeeActivity.findMany({
                where: { employeeId: id },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    createdBy: true,
                },
            }),
            prisma.employeeActivity.count({ where: { employeeId: id } }),
        ]);
        return res.json({
            data: items,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch activity log" });
    }
});
exports.default = router;
