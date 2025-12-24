"use strict";
// src/modules/location/location.settings.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * GET /api/location/:id/settings
 */
router.get("/:id/settings", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const location = await prisma.location.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                // ✅ Auto-lunch (flat fields)
                autoLunchEnabled: true,
                autoLunchMinutes: true,
                autoLunchMinimumShift: true,
                autoLunchDeductOnce: true,
                autoLunchIgnoreIfBreak: true,
                // ✅ Overtime (flat fields)
                overtimeDailyThresholdHours: true,
                overtimeWeeklyThresholdHours: true,
                doubletimeDailyThresholdHours: true,
            },
        });
        if (!location) {
            return res.status(404).json({ error: "Location not found" });
        }
        return res.json(location);
    }
    catch (error) {
        console.error("Error GET location settings:", error);
        return res
            .status(500)
            .json({ error: "Could not load location settings" });
    }
});
/**
 * PATCH /api/location/:id/settings
 */
router.patch("/:id/settings", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { autoLunchEnabled, autoLunchMinutes, autoLunchMinimumShift, autoLunchDeductOnce, autoLunchIgnoreIfBreak, overtimeDailyThresholdHours, overtimeWeeklyThresholdHours, doubletimeDailyThresholdHours, } = req.body;
        const data = {};
        // Auto-lunch
        if (autoLunchEnabled !== undefined)
            data.autoLunchEnabled = autoLunchEnabled;
        if (autoLunchMinutes !== undefined)
            data.autoLunchMinutes = autoLunchMinutes;
        if (autoLunchMinimumShift !== undefined)
            data.autoLunchMinimumShift = autoLunchMinimumShift;
        if (autoLunchDeductOnce !== undefined)
            data.autoLunchDeductOnce = autoLunchDeductOnce;
        if (autoLunchIgnoreIfBreak !== undefined)
            data.autoLunchIgnoreIfBreak = autoLunchIgnoreIfBreak;
        // Overtime
        if (overtimeDailyThresholdHours !== undefined)
            data.overtimeDailyThresholdHours =
                overtimeDailyThresholdHours;
        if (overtimeWeeklyThresholdHours !== undefined)
            data.overtimeWeeklyThresholdHours =
                overtimeWeeklyThresholdHours;
        if (doubletimeDailyThresholdHours !== undefined)
            data.doubletimeDailyThresholdHours =
                doubletimeDailyThresholdHours;
        await prisma.location.update({
            where: { id },
            data,
        });
        return res.json({
            success: true,
            message: "Location settings updated successfully",
        });
    }
    catch (error) {
        console.error("Error PATCH location settings:", error);
        return res
            .status(500)
            .json({ error: "Failed to update settings" });
    }
});
exports.default = router;
