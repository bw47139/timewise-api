// src/modules/location/location.overtime.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * ------------------------------------------------------------
 * GET /api/locations/:id/overtime
 * ------------------------------------------------------------
 */
router.get("/:id/overtime", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const location = await prisma.location.findUnique({
      where: { id },
      select: {
        id: true,
        overtimeDailyEnabled: true,
        overtimeDailyThresholdHours: true,
        doubletimeDailyEnabled: true,
        doubletimeDailyThresholdHours: true,
        overtimeWeeklyEnabled: true,
        overtimeWeeklyThresholdHours: true,
        overtimeRule: true,
      },
    });

    if (!location) return res.status(404).json({ error: "Location not found" });

    return res.json(location);
  } catch (error) {
    console.error("GET OVERTIME ERROR:", error);
    return res.status(500).json({ error: "Failed to load overtime settings" });
  }
});

/**
 * ------------------------------------------------------------
 * PATCH /api/locations/:id/overtime
 * Save updated overtime settings
 * ------------------------------------------------------------
 */
router.patch("/:id/overtime", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    // Basic validation
    if (!["DAILY", "WEEKLY", "BOTH", "NONE"].includes(data.overtimeRule)) {
      return res.status(400).json({ error: "Invalid overtimeRule" });
    }

    // Numeric validation
    const numericFields = [
      "overtimeDailyThresholdHours",
      "doubletimeDailyThresholdHours",
      "overtimeWeeklyThresholdHours",
    ];

    for (const field of numericFields) {
      if (data[field] < 0) {
        return res.status(400).json({ error: `${field} cannot be negative` });
      }
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        overtimeDailyEnabled: data.overtimeDailyEnabled,
        overtimeDailyThresholdHours: data.overtimeDailyThresholdHours,
        doubletimeDailyEnabled: data.doubletimeDailyEnabled,
        doubletimeDailyThresholdHours: data.doubletimeDailyThresholdHours,
        overtimeWeeklyEnabled: data.overtimeWeeklyEnabled,
        overtimeWeeklyThresholdHours: data.overtimeWeeklyThresholdHours,
        overtimeRule: data.overtimeRule,
      },
    });

    return res.json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error("PATCH OVERTIME ERROR:", error);
    return res.status(500).json({ error: "Failed to save overtime settings" });
  }
});

export default router;
