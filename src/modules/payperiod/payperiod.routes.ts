// src/modules/payperiod/payperiod.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient, PayrollPeriodStatus } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();
const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * Helper: require admin/manager roles
 * ------------------------------------------------------
 */
function requireManagerOrAdmin(req: Request) {
  const user = (req as any).user as { id: number; role?: string } | undefined;

  if (!user || !user.role) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = 401;
    throw error;
  }

  const allowed = ["ADMIN", "MANAGER", "OWNER", "SUPERADMIN"];
  if (!allowed.includes(user.role.toUpperCase())) {
    const error = new Error("Forbidden");
    (error as any).statusCode = 403;
    throw error;
  }

  return user;
}

/**
 * ------------------------------------------------------
 * GET /api/payperiod/ping
 * ------------------------------------------------------
 */
router.get("/ping", (_req, res) => {
  res.json({ message: "Pay period routes working" });
});

/**
 * ------------------------------------------------------
 * POST /api/payperiod/generate
 * Generate payroll periods (admin only)
 * ------------------------------------------------------
 */
router.post("/generate", verifyToken, async (req, res) => {
  try {
    requireManagerOrAdmin(req);

    const monthsAhead = Number(req.query.monthsAhead ?? 3);
    const monthsBack = Number(req.query.monthsBack ?? 1);

    const locations = await prisma.location.findMany({
      select: {
        id: true,
        organizationId: true,
        payPeriodType: true,
        weekStartDay: true,
      },
    });

    const now = new Date();

    const startWindow = new Date(now);
    startWindow.setMonth(startWindow.getMonth() - monthsBack);
    startWindow.setHours(0, 0, 0, 0);

    const endWindow = new Date(now);
    endWindow.setMonth(endWindow.getMonth() + monthsAhead);
    endWindow.setHours(23, 59, 59, 999);

    let createdCount = 0;

    for (const loc of locations) {
      const type = loc.payPeriodType;
      const weekStartDay = loc.weekStartDay ?? 1;

      const daysPerPeriod =
        type === "BIWEEKLY" ? 14 : 7;

      let cursor = alignToWeekStart(startWindow, weekStartDay);

      while (cursor <= endWindow) {
        const startDate = new Date(cursor);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysPerPeriod - 1);
        endDate.setHours(23, 59, 59, 999);

        try {
          await prisma.payrollPeriod.create({
            data: {
              organizationId: loc.organizationId,
              locationId: loc.id,
              startDate,
              endDate,
              status: PayrollPeriodStatus.OPEN,
            },
          });
          createdCount++;
        } catch {
          // Ignore duplicates (unique constraint)
        }

        cursor.setDate(cursor.getDate() + daysPerPeriod);
      }
    }

    res.json({
      message: "Payroll periods generated",
      createdCount,
    });
  } catch (err: any) {
    console.error(err);
    res.status(err.statusCode || 500).json({
      error: err.message || "Failed to generate payroll periods",
    });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/payperiod
 * ------------------------------------------------------
 */
router.get("/", verifyToken, async (_req, res) => {
  try {
    const rows = await prisma.payrollPeriod.findMany({
      orderBy: { startDate: "desc" },
      take: 50,
    });

    res.json(
      rows.map((p) => ({
        id: p.id,
        startDate: p.startDate.toISOString().slice(0, 10),
        endDate: p.endDate.toISOString().slice(0, 10),
        status: p.status,
        locationId: p.locationId,
      }))
    );
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Failed to load payroll periods",
    });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/payperiod/:id
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    res.json(period);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Failed to load payroll period",
    });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/payperiod/:id/status
 * ------------------------------------------------------
 */
router.get("/:id/status", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        approvedAt: true,
        approvedByUserId: true,
        lockedAt: true,
        lockedByUserId: true,
        organizationId: true,
        locationId: true,
      },
    });

    if (!period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    res.json(period);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Failed to load payroll period status",
    });
  }
});

/**
 * ------------------------------------------------------
 * POST /api/payperiod/:id/approve
 * ------------------------------------------------------
 */
router.post("/:id/approve", verifyToken, async (req, res) => {
  try {
    const user = requireManagerOrAdmin(req);
    const periodId = Number(req.params.id);

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    if (period.status !== PayrollPeriodStatus.OPEN) {
      return res
        .status(400)
        .json({ error: `Cannot approve period already ${period.status}` });
    }

    const updated = await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: PayrollPeriodStatus.APPROVED,
        approvedAt: new Date(),
        approvedByUserId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYPERIOD_APPROVE",
        entityType: "PayrollPeriod",
        entityId: String(updated.id),
        method: "POST",
        path: `/api/payperiod/${updated.id}/approve`,
        metadata: {
          previousStatus: period.status,
          newStatus: updated.status,
        } as any,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: err.message || "Failed to approve payroll period",
    });
  }
});

/**
 * ------------------------------------------------------
 * POST /api/payperiod/:id/unlock
 * ------------------------------------------------------
 */
router.post("/:id/unlock", verifyToken, async (req, res) => {
  try {
    const user = requireManagerOrAdmin(req);
    const periodId = Number(req.params.id);
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Unlock reason required" });
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    if (
      ![
        PayrollPeriodStatus.APPROVED,
        PayrollPeriodStatus.LOCKED,
      ].includes(period.status)
    ) {
      return res
        .status(400)
        .json({ error: `Cannot unlock period in state ${period.status}` });
    }

    const updated = await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: PayrollPeriodStatus.OPEN,
        approvedAt: null,
        approvedByUserId: null,
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYPERIOD_UNLOCK",
        entityType: "PayrollPeriod",
        entityId: String(updated.id),
        method: "POST",
        path: `/api/payperiod/${updated.id}/unlock`,
        metadata: {
          previousStatus: period.status,
          newStatus: updated.status,
          reason,
        } as any,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      error: err.message || "Failed to unlock payroll period",
    });
  }
});

/**
 * ------------------------------------------------------
 * Helper: Check if a date is inside a locked/approved period
 * ------------------------------------------------------
 */
export async function isDateLockedForOrg(
  organizationId: number,
  locationId: number | null,
  targetDate: Date
): Promise<boolean> {
  const period = await prisma.payrollPeriod.findFirst({
    where: {
      organizationId,
      OR: [
        { locationId: null },
        ...(locationId != null ? [{ locationId }] : []),
      ],
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
      status: {
        in: [
          PayrollPeriodStatus.APPROVED,
          PayrollPeriodStatus.LOCKED,
        ],
      },
    },
  });

  return !!period;
}

/**
 * ------------------------------------------------------
 * Helper: Align date to week start
 * ------------------------------------------------------
 */
function alignToWeekStart(date: Date, weekStartDay: number) {
  const d = new Date(date);
  const diff = (d.getDay() - weekStartDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
