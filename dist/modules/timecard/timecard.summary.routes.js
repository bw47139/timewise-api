"use strict";
// src/modules/timecard/timecard.summary.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * GET /api/timecards/summary?locationId=1&start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get("/summary", async (req, res) => {
    try {
        const { locationId, start, end } = req.query;
        if (!locationId || !start || !end) {
            return res.status(400).json({ error: "Missing query parameters" });
        }
        const punches = await prisma.punch.findMany({
            where: {
                locationId: Number(locationId),
                timestamp: {
                    gte: new Date(start),
                    lte: (0, dayjs_1.default)(end).endOf("day").toDate(),
                },
            },
            include: {
                employee: true,
                location: true,
            },
            orderBy: { timestamp: "asc" }
        });
        // Group punches by employee
        const grouped = {};
        punches.forEach((p) => {
            if (!grouped[p.employeeId])
                grouped[p.employeeId] = [];
            grouped[p.employeeId].push(p);
        });
        const result = Object.keys(grouped).map((key) => {
            const employeeId = Number(key);
            const rows = grouped[employeeId];
            const emp = rows[0].employee;
            let regular = 0;
            let overtime = 0;
            let doubletime = 0;
            let missingPunch = false;
            // Build work sessions
            const sessions = [];
            for (let i = 0; i < rows.length; i += 2) {
                const inPunch = rows[i];
                const outPunch = rows[i + 1];
                if (!outPunch) {
                    missingPunch = true;
                    continue;
                }
                const hours = (0, dayjs_1.default)(outPunch.timestamp).diff(inPunch.timestamp, "minute") / 60;
                // Simple OT split (you can plug in your advanced OT engine)
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
                missingPunch
            };
        });
        return res.json(result);
    }
    catch (error) {
        console.error("SUMMARY ERROR:", error);
        return res.status(500).json({ error: "Failed to generate summary" });
    }
});
exports.default = router;
