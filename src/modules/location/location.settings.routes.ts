// src/modules/location/location.settings.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/location/:id/settings
 */
router.get(
  "/:id/settings",
  verifyToken,
  async (req: Request, res: Response) => {
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
    } catch (error) {
      console.error("Error GET location settings:", error);
      return res
        .status(500)
        .json({ error: "Could not load location settings" });
    }
  }
);

/**
 * PATCH /api/location/:id/settings
 */
router.patch(
  "/:id/settings",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const {
        autoLunchEnabled,
        autoLunchMinutes,
        autoLunchMinimumShift,
        autoLunchDeductOnce,
        autoLunchIgnoreIfBreak,

        overtimeDailyThresholdHours,
        overtimeWeeklyThresholdHours,
        doubletimeDailyThresholdHours,
      } = req.body;

      const data: any = {};

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
    } catch (error) {
      console.error("Error PATCH location settings:", error);
      return res
        .status(500)
        .json({ error: "Failed to update settings" });
    }
  }
);

export default router;
