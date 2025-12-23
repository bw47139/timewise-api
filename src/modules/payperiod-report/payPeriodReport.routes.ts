// src/modules/payperiod-report/payPeriodReport.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  getPayPeriodConfig,
  getPayPeriodForDate,
} from "../timecard/payPeriod.service";

const prisma = new PrismaClient();
const router = Router();

/**
 * ----------------------------------------------------------
 * GET /api/payperiod-report/payperiod?date=YYYY-MM-DD
 * ----------------------------------------------------------
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: "date query param is required (YYYY-MM-DD)" });
    }

    const refDate = new Date(String(date));
    if (isNaN(refDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // TEMP: single-tenant (first org)
    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const config = await getPayPeriodConfig(org.id);

    const payPeriod = getPayPeriodForDate(refDate, config);

    return res.json(payPeriod);
  } catch (err: any) {
    console.error("Pay period report error:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to resolve pay period" });
  }
});

export default router;
