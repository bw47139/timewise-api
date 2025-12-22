// src/modules/location/location.settings.routes.ts

import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/location/:id/settings
 */
router.get("/:id/settings", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        autoLunch: true,
        overtime: true,
      },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (error) {
    console.error("Error GET location settings:", error);
    res.status(500).json({ error: "Could not load location settings" });
  }
});

/**
 * PATCH /api/location/:id/settings
 */
router.patch("/:id/settings", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      autoLunchEnabled,
      autoLunchMinutes,
      autoLunchMinShift,
      autoLunchOncePerShift,
      autoLunchSkipIfBreak,

      overtimeRule,
      dailyEnabled,
      dailyThreshold,
      doubleEnabled,
      doubleThreshold,
      weeklyEnabled,
      weeklyThreshold,
    } = req.body;

    // Update Auto-Lunch
    await prisma.location.update({
      where: { id },
      data: {
        autoLunch: {
          upsert: {
            create: {
              enabled: autoLunchEnabled,
              minutes: autoLunchMinutes,
              minShiftHours: autoLunchMinShift,
              oncePerShift: autoLunchOncePerShift,
              skipIfBreak: autoLunchSkipIfBreak,
            },
            update: {
              enabled: autoLunchEnabled,
              minutes: autoLunchMinutes,
              minShiftHours: autoLunchMinShift,
              oncePerShift: autoLunchOncePerShift,
              skipIfBreak: autoLunchSkipIfBreak,
            },
          },
        },
      },
    });

    // Update Overtime
    await prisma.location.update({
      where: { id },
      data: {
        overtime: {
          upsert: {
            create: {
              rule: overtimeRule,
              dailyEnabled,
              dailyThresholdHours: dailyThreshold,
              doubleEnabled,
              doubleThresholdHours: doubleThreshold,
              weeklyEnabled,
              weeklyThresholdHours: weeklyThreshold,
            },
            update: {
              rule: overtimeRule,
              dailyEnabled,
              dailyThresholdHours: dailyThreshold,
              doubleEnabled,
              doubleThresholdHours: doubleThreshold,
              weeklyEnabled,
              weeklyThresholdHours: weeklyThreshold,
            },
          },
        },
      },
    });

    // ⭐ RETURN SUCCESS JSON
    res.json({
      success: true,
      message: "Location settings updated successfully",
    });

  } catch (error) {
    console.error("Error PATCH location settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
