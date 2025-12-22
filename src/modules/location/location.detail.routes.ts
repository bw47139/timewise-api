import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/location/:id
 * Returns pay-period + auto-lunch settings used by the dashboard
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const location = await prisma.location.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        timezone: true,
        payPeriodType: true,
        weekStartDay: true,
        cutoffTime: true,
        autoLunchEnabled: true,
        autoLunchMinutes: true,
        autoLunchMinimumShift: true,
        autoLunchDeductOnce: true,
        autoLunchIgnoreIfBreak: true,
      },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (err) {
    console.error("❌ GET /api/location/:id error", err);
    res.status(500).json({ error: "Failed to load location settings" });
  }
});

export default router;
