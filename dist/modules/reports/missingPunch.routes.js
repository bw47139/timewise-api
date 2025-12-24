"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Missing Punch Report
 * Finds employees with unmatched IN/OUT punches for a date range.
 */
router.get("/missing-punches", async (req, res) => {
    try {
        const organizationId = Number(req.query.organizationId);
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        if (!organizationId)
            return res.status(400).json({ error: "organizationId is required" });
        // LOAD employees & punches
        const employees = await prisma.employee.findMany({
            where: { organizationId },
            include: {
                punches: {
                    orderBy: { timestamp: "asc" },
                    where: startDate && endDate
                        ? { timestamp: { gte: startDate, lte: endDate } }
                        : undefined
                }
            }
        });
        const missingPunchReport = [];
        for (const emp of employees) {
            let lastType = null;
            for (const punch of emp.punches) {
                if ((lastType === "IN" && punch.type === "IN") ||
                    (lastType === "OUT" && punch.type === "OUT")) {
                    // MISSING PUNCH DETECTED
                    missingPunchReport.push({
                        employeeId: emp.id,
                        employeeName: `${emp.firstName} ${emp.lastName}`,
                        problem: `Unexpected "${punch.type}" punch`,
                        previousPunchType: lastType,
                        punchId: punch.id,
                        timestamp: punch.timestamp
                    });
                }
                lastType = punch.type === "IN" || punch.type === "OUT"
                    ? punch.type
                    : null;
            }
            // END OF DAY CHECK (IN without OUT)
            if (lastType === "IN") {
                const lastPunch = emp.punches[emp.punches.length - 1];
                missingPunchReport.push({
                    employeeId: emp.id,
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    problem: "Missing OUT punch",
                    punchId: lastPunch?.id ?? null,
                    timestamp: lastPunch?.timestamp ?? null
                });
            }
        }
        res.json({
            organizationId,
            startDate,
            endDate,
            missingPunches: missingPunchReport
        });
    }
    catch (error) {
        console.error("Missing Punch Report error:", error);
        res.status(500).json({ error: "Failed to compute missing punch report" });
    }
});
exports.default = router;
