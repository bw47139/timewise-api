// src/modules/organization/pay-period.routes.ts

import { Router, Request, Response } from "express";

import { prisma } from "../../prisma";
import {
  getPayPeriodRange,
  buildEffectiveSettingsFromOrgAndLocation,
} from "../../utils/payPeriodEngine";

const router = Router();

/**
 * GET /api/organization/pay-period
 * Return the organization's current pay-period configuration.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        timezone: true,
        payPeriodType: true,
        weekStartDay: true,
        biWeeklyAnchorDate: true,
        cutoffTime: true,
        semiMonthCut1: true,
        semiMonthCut2: true,
        monthlyCutDay: true,
      },
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(org);
  } catch (err) {
    console.error("GET /api/organization/pay-period error:", err);
    return res
      .status(500)
      .json({ error: "Failed to load pay-period settings" });
  }
});

/**
 * PATCH /api/organization/pay-period
 * Update organization-level pay-period configuration.
 */
router.patch("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      payPeriodType,
      weekStartDay,
      biWeeklyAnchorDate,
      cutoffTime,
      semiMonthCut1,
      semiMonthCut2,
      monthlyCutDay,
    } = req.body;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(payPeriodType && { payPeriodType }),
        ...(weekStartDay !== undefined && { weekStartDay }),
        ...(biWeeklyAnchorDate && { biWeeklyAnchorDate }),
        ...(cutoffTime && { cutoffTime }),
        ...(semiMonthCut1 !== undefined && { semiMonthCut1 }),
        ...(semiMonthCut2 !== undefined && { semiMonthCut2 }),
        ...(monthlyCutDay !== undefined && { monthlyCutDay }),
      },
      select: {
        id: true,
        timezone: true,
        payPeriodType: true,
        weekStartDay: true,
        biWeeklyAnchorDate: true,
        cutoffTime: true,
        semiMonthCut1: true,
        semiMonthCut2: true,
        monthlyCutDay: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/organization/pay-period error:", err);
    return res
      .status(500)
      .json({ error: "Failed to update pay-period settings" });
  }
});

/**
 * GET /api/organization/pay-period/preview
 *
 * Query params:
 *  - date (optional)       → "YYYY-MM-DD", default = today
 *  - locationId (optional) → number, to apply per-location overrides
 *
 * Uses the PayPeriodEngine to compute:
 *  - start/end calendar dates
 *  - UTC date-time range for DB queries
 */
router.get("/preview", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { date, locationId } = req.query;

    // 1) Load organization
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // 2) Optional: load location for overrides
    let location: any = null;
    if (locationId) {
      location = await prisma.location.findFirst({
        where: {
          id: Number(locationId),
          organizationId: orgId,
        },
      });
    }

    // 3) Build effective settings (org + location)
    const settings = buildEffectiveSettingsFromOrgAndLocation({
      organization: org,
      location,
    });

    // 4) Target date inside the pay period
    const targetDate = date ? new Date(String(date)) : new Date();

    // 5) Use engine to calculate range
    const period = getPayPeriodRange(settings, targetDate);

    return res.json({
      organizationId: orgId,
      locationId: location ? location.id : null,
      settings,
      period,
    });
  } catch (err) {
    console.error("GET /api/organization/pay-period/preview error:", err);
    return res
      .status(500)
      .json({ error: "Failed to calculate pay period" });
  }
});

export default router;
