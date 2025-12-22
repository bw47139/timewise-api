// src/modules/location/location.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * ------------------------------------------------------
 * GET /api/location
 * List all locations for current organization
 * ------------------------------------------------------
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;

    const locations = await prisma.location.findMany({
      where: { organizationId },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        timezone: true,
        industry: true,  // ⭐ REQUIRED for employee profile
      },
    });

    return res.json(locations);
  } catch (err) {
    console.error("❌ Failed to load locations:", err);
    return res.status(500).json({ error: "Failed to load locations" });
  }
});

/**
 * ------------------------------------------------------
 * POST /api/location
 * Create a new location
 * ------------------------------------------------------
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;
    const { name, timezone, industry } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Location name is required" });
    }

    const created = await prisma.location.create({
      data: {
        name: name.trim(),
        timezone: timezone || "America/New_York",
        industry: industry || null,
        organizationId,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("❌ Failed to create location:", err);
    return res.status(500).json({ error: "Failed to create location" });
  }
});

/**
 * ------------------------------------------------------
 * PATCH /api/location/:id
 * Update location
 * ------------------------------------------------------
 */
router.patch("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, timezone, industry } = req.body;

    const updated = await prisma.location.update({
      where: { id: Number(id) },
      data: {
        ...(name ? { name } : {}),
        ...(timezone ? { timezone } : {}),
        industry: industry ?? null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update location:", err);
    return res.status(500).json({ error: "Failed to update location" });
  }
});

/**
 * ------------------------------------------------------
 * DELETE /api/location/:id
 * Delete a location
 * ------------------------------------------------------
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.location.delete({
      where: { id: Number(id) },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete location:", err);
    return res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;
