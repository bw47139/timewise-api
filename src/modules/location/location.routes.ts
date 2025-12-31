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

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLocationId: true },
    });

    const locations = await prisma.location.findMany({
      where: { organizationId },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        timezone: true,
        industry: true,
        isActive: true,
        payPeriodType: true,
      },
    });

    const withDefaultFlag = locations.map((loc) => ({
      ...loc,
      isDefault: loc.id === org?.defaultLocationId,
    }));

    return res.json(withDefaultFlag);
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
    const { name, timezone, industry, payPeriodType } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Location name is required" });
    }

    const created = await prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          name: name.trim(),
          timezone: timezone || "America/New_York",
          industry: industry || null,
          payPeriodType: payPeriodType || "BIWEEKLY",
          organizationId,
          isActive: true,
        },
      });

      const org = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { defaultLocationId: true },
      });

      if (!org?.defaultLocationId) {
        await tx.organization.update({
          where: { id: organizationId },
          data: { defaultLocationId: location.id },
        });
      }

      return location;
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
    const { organizationId } = req.user as any;
    const { id } = req.params;
    const { name, timezone, industry, payPeriodType } = req.body;

    const location = await prisma.location.findFirst({
      where: { id: Number(id), organizationId },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    const updated = await prisma.location.update({
      where: { id: location.id },
      data: {
        ...(name ? { name } : {}),
        ...(timezone ? { timezone } : {}),
        ...(payPeriodType ? { payPeriodType } : {}),
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
 * POST /api/location/:id/status
 * Enable / Disable location
 * ------------------------------------------------------
 */
router.post("/:id/status", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;
    const { id } = req.params;
    const { isActive } = req.body;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLocationId: true },
    });

    const location = await prisma.location.findFirst({
      where: { id: Number(id), organizationId },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // 🔒 BLOCK disabling default location
    if (!isActive && org?.defaultLocationId === location.id) {
      return res.status(400).json({
        error: "Default location cannot be disabled",
      });
    }

    const updated = await prisma.location.update({
      where: { id: location.id },
      data: { isActive: Boolean(isActive) },
    });

    return res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update location status:", err);
    return res.status(500).json({ error: "Failed to update location status" });
  }
});

/**
 * ------------------------------------------------------
 * POST /api/location/:id/make-default
 * Set default location for organization
 * ------------------------------------------------------
 */
router.post(
  "/:id/make-default",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const locationId = Number(req.params.id);

      const location = await prisma.location.findFirst({
        where: {
          id: locationId,
          organizationId,
          isActive: true, // 🔒 must be active
        },
      });

      if (!location) {
        return res.status(404).json({
          error: "Active location not found",
        });
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: { defaultLocationId: locationId },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ Failed to set default location:", err);
      return res.status(500).json({ error: "Failed to set default location" });
    }
  }
);

/**
 * ------------------------------------------------------
 * DELETE /api/location/:id
 * Delete a location
 * ------------------------------------------------------
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;
    const { id } = req.params;
    const locationId = Number(id);

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLocationId: true },
    });

    // 🔒 BLOCK deleting default location
    if (org?.defaultLocationId === locationId) {
      return res.status(400).json({
        error: "Default location cannot be deleted",
      });
    }

    const location = await prisma.location.findFirst({
      where: { id: locationId, organizationId },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    await prisma.location.delete({
      where: { id: location.id },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete location:", err);
    return res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;
