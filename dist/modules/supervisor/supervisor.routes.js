"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Supervisor Clock Override
 * Allows supervisors to manually clock employees IN or OUT.
 */
router.post("/clock", async (req, res) => {
    try {
        const { employeeId, locationId, type, supervisorId, reason, timestamp } = req.body;
        if (!employeeId || !locationId || !type) {
            return res.status(400).json({
                error: "employeeId, locationId, and type are required"
            });
        }
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });
        const punch = await prisma.punch.create({
            data: {
                employeeId,
                locationId,
                type,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                isSupervisorOverride: true,
                overrideByUserId: supervisorId ?? null,
                overrideReason: reason ?? null
            }
        });
        res.json({
            message: "Supervisor override punch added successfully",
            punch
        });
    }
    catch (error) {
        console.error("Supervisor override error:", error);
        res.status(500).json({ error: "Failed to apply supervisor override" });
    }
});
exports.default = router;
