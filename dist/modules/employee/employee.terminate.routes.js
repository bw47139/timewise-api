"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
function getAuthUserId(req) {
    const user = req.user;
    if (!user || !user.userId)
        return null;
    return Number(user.userId);
}
/**
 * TERMINATE EMPLOYEE
 * POST /api/employees/:id/terminate
 */
router.post("/:id/terminate", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { reason } = req.body;
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                status: "INACTIVE",
                terminatedAt: new Date(),
                terminationReason: reason || null,
            },
        });
        // Log activity
        await prisma.employeeActivity.create({
            data: {
                employeeId: id,
                type: "TERMINATED",
                description: reason ? `Terminated. Reason: ${reason}` : "Terminated",
                createdById: getAuthUserId(req) || undefined,
            },
        });
        return res.json({ message: "Employee terminated", employee });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to terminate employee" });
    }
});
/**
 * SOFT-DELETE EMPLOYEE
 * POST /api/employees/:id/soft-delete
 */
router.post("/:id/soft-delete", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                isDeleted: true,
                terminatedAt: new Date(),
            },
        });
        await prisma.employeeActivity.create({
            data: {
                employeeId: id,
                type: "SOFT_DELETED",
                description: "Employee was soft-deleted",
                createdById: getAuthUserId(req) || undefined,
            },
        });
        return res.json({ message: "Employee soft-deleted", employee });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to soft-delete employee" });
    }
});
/**
 * RESTORE EMPLOYEE
 * POST /api/employees/:id/restore
 */
router.post("/:id/restore", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                isDeleted: false,
                terminatedAt: null,
                terminationReason: null,
                status: "ACTIVE",
            },
        });
        await prisma.employeeActivity.create({
            data: {
                employeeId: id,
                type: "RESTORED",
                description: "Employee restored",
                createdById: getAuthUserId(req) || undefined,
            },
        });
        return res.json({ message: "Employee restored", employee });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to restore employee" });
    }
});
exports.default = router;
