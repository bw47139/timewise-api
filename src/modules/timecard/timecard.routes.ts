// UPDATED FULL FILE — NOW LOCK-AWARE

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

import { calculatePayroll } from "./payroll.service";
import { getPayPeriodForDate } from "./payPeriod.service";
import { isDateLockedForOrg } from "../payperiod/payperiod.routes";   // ⭐ NEW

const prisma = new PrismaClient();
const router = Router();

/**
 * ----------------------------------------------------------
 * GET /api/timecards/employee/:id?date=YYYY-MM-DD
 *
 * - Resolves pay period
 * - Loads punches for that period
 * - Calculates hours + gross
 * - ⭐ NEW → Includes "locked" in response
 * ----------------------------------------------------------
 */
router.get("/employee/:id", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const { date } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: "Invalid employeeId" });
    }

    if (!date) {
      return res.status(400).json({
        error: "date query param is required (YYYY-MM-DD)",
      });
    }

    // --------------------------------------------------
    // Load employee
    // --------------------------------------------------
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        location: true,
        organization: true,
      },
    });

    if (!employee || !employee.organization) {
      return res
        .status(404)
        .json({ error: "Employee or organization not found" });
    }

    const location = employee.location;
    const organization = employee.organization;

    // --------------------------------------------------
    // Resolve Pay Period
    // --------------------------------------------------
    const payPeriod = getPayPeriodForDate(String(date), {
      payPeriodType:
        location?.payPeriodType ?? organization.payPeriodType,
      weekStartDay:
        location?.weekStartDay ?? organization.weekStartDay ?? undefined,
      biweeklyAnchorDate:
        location?.biweeklyAnchorDate ??
        organization.biweeklyAnchorDate ??
        undefined,
    });

    const periodStart = new Date(payPeriod.start);
    const periodEnd = new Date(payPeriod.end);

    // ----------------------------------------------------------
    // ⭐ NEW — Check if this pay period is locked
    // ----------------------------------------------------------
    const locked = await isDateLockedForOrg(
      employee.organizationId,
      employee.locationId,
      periodStart
    );

    let approvalInfo = null;

    if (locked) {
      const periodRecord = await prisma.payrollPeriod.findFirst({
        where: {
          organizationId: employee.organizationId,
          locationId: employee.locationId,
          startDate: periodStart,
          endDate: periodEnd,
        },
        select: {
          status: true,
          approvedAt: true,
          approvedBy: true,
        },
      });

      approvalInfo = periodRecord || {
        status: "APPROVED",
      };
    }

    // --------------------------------------------------
    // Load punches within this period
    // --------------------------------------------------
    const punches = await prisma.punch.findMany({
      where: {
        employeeId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // --------------------------------------------------
    // Load latest pay rate
    // --------------------------------------------------
    const latestRate = await prisma.payRate.findFirst({
      where: { employeeId },
      orderBy: { effectiveDate: "desc" },
    });

    const hourlyRate = latestRate?.rate ?? 0;

    // --------------------------------------------------
    // Group punches by day
    // --------------------------------------------------
    const dayMap = new Map<
      string,
      {
        date: string;
        punches: typeof punches;
        totalHours: number;
      }
    >();

    for (const p of punches) {
      const day = dayjs(p.timestamp).format("YYYY-MM-DD");

      if (!dayMap.has(day)) {
        dayMap.set(day, {
          date: day,
          punches: [],
          totalHours: 0,
        });
      }

      dayMap.get(day)!.punches.push(p);
    }

    // --------------------------------------------------
    // Calculate IN/OUT hours
    // --------------------------------------------------
    for (const day of dayMap.values()) {
      const list = day.punches;

      for (let i = 0; i < list.length; i += 2) {
        const inPunch = list[i];
        const outPunch = list[i + 1];

        if (!inPunch || !outPunch) continue;

        const diffHours =
          (outPunch.timestamp.getTime() -
            inPunch.timestamp.getTime()) /
          1000 /
          60 /
          60;

        day.totalHours += diffHours;
      }

      day.totalHours = Number(day.totalHours.toFixed(2));
    }

    const days = Array.from(dayMap.values());

    // --------------------------------------------------
    // Payroll calculation
    // --------------------------------------------------
    const payroll = calculatePayroll(
      punches.map((p) => ({
        type: p.type as "IN" | "OUT",
        timestamp: p.timestamp,
      })),
      {
        hourlyRate,
        overtimeMultiplier: 1.5,
      }
    );

    // --------------------------------------------------
    // Response (STABLE CONTRACT + ⭐ NEW lock info)
    // --------------------------------------------------
    return res.json({
      employeeId,
      payPeriod: {
        type: payPeriod.type,
        start: payPeriod.start,
        end: payPeriod.end,
        locked,                   // ⭐ NEW
        approval: approvalInfo,   // ⭐ NEW
      },
      hourlyRate,
      days,
      payroll,
    });
  } catch (err) {
    console.error("Timecard error:", err);
    return res.status(500).json({ error: "Failed to load timecard" });
  }
});

export default router;
