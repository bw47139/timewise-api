"use strict";
// src/modules/timecard/timecard.detail.routes.ts
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
 * GET /api/timecards/detail?employeeId=1&start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get("/detail", async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;
        if (!employeeId || !start || !end) {
            return res.status(400).json({
                error: "Missing required parameters: employeeId, start, end",
            });
        }
        const employee = await prisma.employee.findUnique({
            where: { id: Number(employeeId) },
            include: {
                location: true,
                organization: true,
            },
        });
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        // -----------------------------------------------------
        // LOAD ALL PUNCHES FOR THE RANGE
        // -----------------------------------------------------
        const punches = await prisma.punch.findMany({
            where: {
                employeeId: Number(employeeId),
                timestamp: {
                    gte: new Date(start),
                    lte: (0, dayjs_1.default)(end).endOf("day").toDate(),
                },
            },
            include: {
                location: true,
            },
            orderBy: { timestamp: "asc" },
        });
        // -----------------------------------------------------
        // BUILD WORK SESSIONS
        // -----------------------------------------------------
        const sessions = [];
        let missingPunch = false;
        for (let i = 0; i < punches.length; i += 2) {
            const punchIn = punches[i];
            const punchOut = punches[i + 1];
            if (!punchOut) {
                missingPunch = true;
                sessions.push({
                    in: punchIn.timestamp,
                    out: null,
                    hours: 0,
                });
                continue;
            }
            const diffMinutes = (0, dayjs_1.default)(punchOut.timestamp).diff(punchIn.timestamp, "minute");
            const hours = diffMinutes / 60;
            sessions.push({
                in: punchIn.timestamp,
                out: punchOut.timestamp,
                hours: Number(hours.toFixed(2)),
            });
        }
        // -----------------------------------------------------
        // CALCULATE HOURS TOTALS
        // -----------------------------------------------------
        let regular = 0;
        let overtime = 0;
        let doubletime = 0;
        for (const s of sessions) {
            if (!s.out)
                continue; // skip incomplete session
            if (s.hours > 12) {
                doubletime += s.hours - 12;
                overtime += 4; // 8–12
                regular += 8;
            }
            else if (s.hours > 8) {
                overtime += s.hours - 8;
                regular += 8;
            }
            else {
                regular += s.hours;
            }
        }
        const summary = {
            sessions,
            regular: Number(regular.toFixed(2)),
            overtime: Number(overtime.toFixed(2)),
            doubletime: Number(doubletime.toFixed(2)),
            missingPunch,
        };
        return res.json({
            employee,
            rows: punches,
            summary,
        });
    }
    catch (error) {
        console.error("TIME CARD DETAIL ERROR:", error);
        return res.status(500).json({ error: "Server error loading timecard detail" });
    }
});
exports.default = router;
