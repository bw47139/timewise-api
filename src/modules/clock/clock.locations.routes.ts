import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * ------------------------------------------------------
 * GET /api/clock/locations
 * Public endpoint for clock kiosks
 * ------------------------------------------------------
 */
router.get("/locations", async (_req, res) => {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(locations);
  } catch (err) {
    console.error("Clock locations error:", err);
    res.status(500).json({ error: "Failed to load locations" });
  }
});

export default router;
