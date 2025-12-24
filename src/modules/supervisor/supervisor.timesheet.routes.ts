import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { computePayPeriod } from "../payperiod/payperiod.service";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET full employee timesheet for a pay period or date range
 */
router.get("/timesheet", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.query.employeeId);
    const start = req.query.start ? new Date(req.query.start as string) : null;
    const end = req.query.end ? new Date(req.query.end as string) : null;

    if (!employeeId)
      return res.status(400).json({ error: "employeeId is required" });

    // If no date range, compute pay period automatically:
    let startDate = start;
    let endDate = end;

    if (!start || !end) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { organization: true }
      });

      if (!employee)
        return res.status(404).json({ error: "Employee not found" });

      const pp = computePayPeriod(employee.organization, new Date());
      startDate = pp.startDate;
      endDate = pp.endDate;
    }

    const punches = await prisma.punch.findMany({
      where: {
        employeeId,
        timestamp: {
          gte: startDate!,
          lte: endDate!
        }
      },
      orderBy: { timestamp: "asc" }
    });

    res.json({
      employeeId,
      startDate,
      endDate,
      punches
    });

  } catch (error) {
    console.error("Timesheet error:", error);
    res.status(500).json({ error: "Failed to load timesheet" });
  }
});

export default router;
