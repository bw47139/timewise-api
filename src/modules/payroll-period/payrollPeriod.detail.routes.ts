// src/modules/payroll-period/payrollPeriod.detail.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient, EmployeeStatus } from "@prisma/client";
import dayjs from "dayjs";
import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * ------------------------------------------------------
 * GET /api/payroll-period/:id
 *
 * Returns a single payroll period for the logged-in org
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const payPeriodId = Number(req.params.id);
    const { organizationId } = req.user as any;

    if (!payPeriodId || Number.isNaN(payPeriodId)) {
      return res.status(400).json({ error: "Invalid payroll period id" });
    }

    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id: payPeriodId,
        organizationId,
      },
      include: {
        location: true,
      },
    });

    if (!period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    return res.json(period);
  } catch (error) {
    console.error("❌ Failed to load payroll period:", error);
    return res.status(500).json({ error: "Failed to load payroll period" });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/payroll-period/:id/employees
 *
 * Returns employees + hours for this payroll period.
 *
 * Shape:
 * [
 *   {
 *     employeeId,
 *     employeeName,
 *     regular,
 *     overtime,
 *     doubletime,
 *     missingPunch,
 *     punchPairs: [
 *       { in: string, out: string | null, hours: number | null }
 *     ]
 *   }
 * ]
 * ------------------------------------------------------
 */
router.get(
  "/:id/employees",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const payPeriodId = Number(req.params.id);
      const { organizationId } = req.user as any;

      if (!payPeriodId || Number.isNaN(payPeriodId)) {
        return res.status(400).json({ error: "Invalid payroll period id" });
      }

      const period = await prisma.payrollPeriod.findFirst({
        where: {
          id: payPeriodId,
          organizationId,
        },
        include: {
          location: true,
        },
      });

      if (!period) {
        return res.status(404).json({ error: "Payroll period not found" });
      }

      const start = period.startDate;
      const end = period.endDate;
      const locationId = period.locationId;

      if (!locationId) {
        return res
          .status(400)
          .json({ error: "Payroll period has no associated location" });
      }

      const punches = await prisma.punch.findMany({
        where: {
          locationId,
          timestamp: {
            gte: start,
            lte: dayjs(end).endOf("day").toDate(),
          },
          employee: {
            organizationId,
            isDeleted: false,
            status: EmployeeStatus.ACTIVE,
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      // Group by employeeId
      const grouped: Record<number, typeof punches> = {};
      for (const p of punches) {
        if (!grouped[p.employeeId]) grouped[p.employeeId] = [];
        grouped[p.employeeId].push(p);
      }

      const results = Object.keys(grouped).map((key) => {
        const employeeId = Number(key);
        const rows = grouped[employeeId];
        const emp = rows[0].employee;

        let regular = 0;
        let overtime = 0;
        let doubletime = 0;
        let missingPunch = false;

        const punchPairs: {
          in: string;
          out: string | null;
          hours: number | null;
        }[] = [];

        for (let i = 0; i < rows.length; i += 2) {
          const inPunch = rows[i];
          const outPunch = rows[i + 1];

          if (!outPunch) {
            // Missing OUT punch
            missingPunch = true;
            punchPairs.push({
              in: inPunch.timestamp.toISOString(),
              out: null,
              hours: null,
            });
            continue;
          }

          const hours =
            dayjs(outPunch.timestamp).diff(inPunch.timestamp, "minute") / 60;

          punchPairs.push({
            in: inPunch.timestamp.toISOString(),
            out: outPunch.timestamp.toISOString(),
            hours: Number(hours.toFixed(2)),
          });

          // Simple OT/DT logic (same as summary)
          if (hours > 12) {
            doubletime += hours - 12;
            overtime += 4; // 8–12
            regular += 8;
          } else if (hours > 8) {
            overtime += hours - 8;
            regular += 8;
          } else {
            regular += hours;
          }
        }

        return {
          employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          regular: Number(regular.toFixed(2)),
          overtime: Number(overtime.toFixed(2)),
          doubletime: Number(doubletime.toFixed(2)),
          missingPunch,
          punchPairs,
        };
      });

      return res.json(results);
    } catch (error) {
      console.error("❌ Failed to load payroll period employees:", error);
      return res
        .status(500)
        .json({ error: "Failed to load payroll period employees" });
    }
  }
);

/**
 * ------------------------------------------------------
 * GET /api/payroll-period/:id/employees/:employeeId/punches
 *
 * Raw punches for a single employee in this period.
 * ------------------------------------------------------
 */
router.get(
  "/:id/employees/:employeeId/punches",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const payPeriodId = Number(req.params.id);
      const employeeId = Number(req.params.employeeId);
      const { organizationId } = req.user as any;

      if (!payPeriodId || !employeeId) {
        return res.status(400).json({ error: "Invalid ids" });
      }

      const period = await prisma.payrollPeriod.findFirst({
        where: {
          id: payPeriodId,
          organizationId,
        },
      });

      if (!period) {
        return res.status(404).json({ error: "Payroll period not found" });
      }

      const punches = await prisma.punch.findMany({
        where: {
          employeeId,
          locationId: period.locationId ?? undefined,
          timestamp: {
            gte: period.startDate,
            lte: dayjs(period.endDate).endOf("day").toDate(),
          },
          employee: {
            organizationId,
          },
        },
        orderBy: { timestamp: "asc" },
      });

      return res.json(punches);
    } catch (error) {
      console.error("❌ Failed to load punches for employee:", error);
      return res
        .status(500)
        .json({ error: "Failed to load punches for employee" });
    }
  }
);

/**
 * ------------------------------------------------------
 * POST /api/payroll-period/:id/pdf-summary
 *
 * Placeholder for future PDF export. For now, returns 501.
 * (We can wire this into your existing PDF/S3 system later.)
 * ------------------------------------------------------
 */
router.post(
  "/:id/pdf-summary",
  verifyToken,
  async (_req: Request, res: Response) => {
    return res
      .status(501)
      .json({ error: "PDF summary export not implemented yet" });
  }
);

export default router;
