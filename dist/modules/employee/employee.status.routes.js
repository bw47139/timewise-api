"use strict";
// src/modules/employee/employee.status.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * PATCH /api/employees/:id/status
 * Toggle employee active/inactive
 */
router.patch("/:id/status", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }
        const employee = await prisma.employee.update({
            where: { id },
            data: { status },
        });
        res.json(employee);
    }
    catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ error: "Failed to update employee status" });
    }
});
exports.default = router;
