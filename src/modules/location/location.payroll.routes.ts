// src/modules/location/location.payroll.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/locations/:id/payroll
 * Fetch per-location payroll + auto-lunch settings
 */
router.get("/:id/payroll", verifyToken, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.id);

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        timezone: true,

        // Auto Lunch
        autoLunchEnabled: true,
        autoLunchMinutes: true,
        autoLunchMinimumShift: true,
        autoLunchDeductOnce: true,
        autoLunchIgnoreIfBreak: true,

        // Overtime
        overtimeDailyEnabled: true,
        overtimeDailyThresholdHours: true,
        doubletimeDailyEnabled: true,
        doubletimeDailyThresholdHours: true,
        overtimeWeeklyEnabled: true,
        overtimeWeeklyThresholdHours: true,

        cutoffTime: true,
      },
    });

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    return res.json(location);
  } catch (err) {
    console.error("GET /locations/:id/payroll error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/locations/:id/payroll
 * Update per-location payroll settings
 */
router.put("/:id/payroll", verifyToken, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.id);

    const {
      autoLunchEnabled,
      autoLunchMinutes,
      autoLunchMinimumShift,
      autoLunchDeductOnce,
      autoLunchIgnoreIfBreak,

      overtimeDailyEnabled,
      overtimeDailyThresholdHours,
      doubletimeDailyEnabled,
      doubletimeDailyThresholdHours,
      overtimeWeeklyEnabled,
      overtimeWeeklyThresholdHours,

      cutoffTime,
    } = req.body;

    const updated = await prisma.location.update({
      where: { id: locationId },
      data: {
        autoLunchEnabled,
        autoLunchMinutes,
        autoLunchMinimumShift,
        autoLunchDeductOnce,
        autoLunchIgnoreIfBreak,

        overtimeDailyEnabled,
        overtimeDailyThresholdHours,
        doubletimeDailyEnabled,
        doubletimeDailyThresholdHours,
        overtimeWeeklyEnabled,
        overtimeWeeklyThresholdHours,

        cutoffTime,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PUT /locations/:id/payroll error:", err);
    return res.status(500).json({ message: "Update failed" });
  }
});

export default router;
