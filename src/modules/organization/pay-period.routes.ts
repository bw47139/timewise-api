// src/modules/organization/pay-period.routes.ts

import { Router, Request, Response } from "express";
import { PayPeriodType } from "../../utils/payPeriodEngine";

import { prisma } from "../../prisma";
import { verifyToken } from "../../middleware/verifyToken";
import {
  getPayPeriodRange,
  buildEffectiveSettingsFromOrgAndLocation,
} from "../../utils/payPeriodEngine";

const router = Router();

/**
 * =====================================================
 * GET /api/organization/pay-period
 * -----------------------------------------------------
 * Return the organization's current pay-period config
 * =====================================================
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        timezone: true,
        payPeriodType: true,
        weekStartDay: true,
        biweeklyAnchorDate: true, // ✅ FIXED
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
  } catch (error) {
    console.error("❌ GET /organization/pay-period:", error);
    return res
      .status(500)
      .json({ error: "Failed to load pay-period settings" });
  }
});

/**
 * =====================================================
 * PATCH /api/organization/pay-period
 * -----------------------------------------------------
 * Update organization-level pay-period configuration
 * =====================================================
 */
router.patch("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;

    const {
      payPeriodType,
      weekStartDay,
      biweeklyAnchorDate, // ✅ FIXED
      cutoffTime,
      semiMonthCut1,
      semiMonthCut2,
      monthlyCutDay,
    } = req.body;

    // ---- Validate PayPeriodType ----
    if (
      payPeriodType !== undefined &&
      !Object.values(PayPeriodType).includes(payPeriodType)
    ) {
      return res.status(400).json({
        error: "Invalid payPeriodType",
      });
    }

    // ---- Validate weekStartDay ----
    if (
      weekStartDay !== undefined &&
      (weekStartDay < 0 || weekStartDay > 6)
    ) {
      return res.status(400).json({
        error: "weekStartDay must be between 0 (Sunday) and 6 (Saturday)",
      });
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(payPeriodType !== undefined && { payPeriodType }),
        ...(weekStartDay !== undefined && { weekStartDay }),
        ...(biweeklyAnchorDate !== undefined && { biweeklyAnchorDate }), // ✅ FIXED
        ...(cutoffTime !== undefined && { cutoffTime }),
        ...(semiMonthCut1 !== undefined && { semiMonthCut1 }),
        ...(semiMonthCut2 !== undefined && { semiMonthCut2 }),
        ...(monthlyCutDay !== undefined && { monthlyCutDay }),
      },
      select: {
        id: true,
        timezone: true,
        payPeriodType: true,
        weekStartDay: true,
        biweeklyAnchorDate: true, // ✅ FIXED
        cutoffTime: true,
        semiMonthCut1: true,
        semiMonthCut2: true,
        monthlyCutDay: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("❌ PATCH /organization/pay-period:", error);
    return res
      .status(500)
      .json({ error: "Failed to update pay-period settings" });
  }
});

/**
 * =====================================================
 * GET /api/organization/pay-period/preview
 * -----------------------------------------------------
 * Calculates a pay-period window using the engine
 * =====================================================
 */
router.get(
  "/preview",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.user as any;
      const { date, locationId } = req.query;

      // 1) Load organization
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // 2) Optional location override
      let location = null;
      if (locationId) {
        location = await prisma.location.findFirst({
          where: {
            id: Number(locationId),
            organizationId,
          },
        });
      }

      // 3) Build effective settings
      const settings = buildEffectiveSettingsFromOrgAndLocation({
        organization,
        location,
      });

      // 4) Resolve target date
      const targetDate = date ? new Date(String(date)) : new Date();

      // 5) Compute pay period
      const period = getPayPeriodRange(settings, targetDate);

      return res.json({
        organizationId,
        locationId: location ? location.id : null,
        settings,
        period,
      });
    } catch (error) {
      console.error("❌ GET /organization/pay-period/preview:", error);
      return res
        .status(500)
        .json({ error: "Failed to calculate pay period" });
    }
  }
);

export default router;
