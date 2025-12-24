// src/modules/payperiod-report/payrollSummary.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";
import { generatePayrollSummary } from "./payrollSummary.service";

const prisma = new PrismaClient();
const router = Router();

/**
 * ==========================================================
 * AUTO-LOADED PATH STRUCTURE
 * ==========================================================
 *
 * File: payrollSummary.routes.ts
 * Mounted at: /api/payperiod-report/payroll
 *
 * FINAL ENDPOINT:
 *   GET /api/payperiod-report/payroll/summary?payPeriodId=123
 *
 * ==========================================================
 */

router.get(
  "/summary",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { payPeriodId } = req.query;

      // --------------------------------------------------
      // Validate input
      // --------------------------------------------------
      if (!payPeriodId || isNaN(Number(payPeriodId))) {
        return res.status(400).json({
          error: "payPeriodId query param is required",
        });
      }

      // --------------------------------------------------
      // Load payroll period
      // --------------------------------------------------
      const period = await prisma.payrollPeriod.findUnique({
        where: { id: Number(payPeriodId) },
      });

      if (!period) {
        return res.status(404).json({
          error: "Payroll period not found",
        });
      }

      // --------------------------------------------------
      // TEMP: Single-tenant mode
      // Later orgId will come from JWT
      // --------------------------------------------------
      const organizationId = period.organizationId;

      // --------------------------------------------------
      // Generate payroll summary
      // --------------------------------------------------
      const summary = await generatePayrollSummary(
        organizationId,
        period
      );

      return res.json(summary);
    } catch (err: any) {
      console.error("❌ Payroll summary error:", err);

      return res.status(500).json({
        error: "Failed to generate payroll summary",
      });
    }
  }
);

export default router;
