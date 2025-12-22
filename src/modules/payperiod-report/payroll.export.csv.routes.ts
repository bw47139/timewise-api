import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * -------------------------------------------------
 * GET /api/payperiod-report/payroll/export/csv
 * Query: payPeriodId
 * -------------------------------------------------
 */
router.get(
  "/export/csv",
  verifyToken,
  async (req, res) => {
    try {
      const payPeriodId = Number(req.query.payPeriodId);
      const { organizationId } = req.auth!;

      if (!payPeriodId) {
        return res.status(400).send("payPeriodId required");
      }

      const snapshot = await prisma.payrollSnapshot.findUnique({
        where: {
          organizationId_payPeriodId: {
            organizationId,
            payPeriodId,
          },
        },
      });

      if (!snapshot) {
        return res.status(404).send("Payroll not locked");
      }

      const data: any = snapshot.snapshotData;

      let csv =
        "Employee,Regular Hours,OT Hours,DT Hours,PTO Hours,Rate,Gross Pay\n";

      for (const e of data.employees) {
        csv += `"${e.name}",${e.regularHours},${e.overtimeHours},${e.doubletimeHours ?? 0},${e.ptoHours ?? 0},${e.rate},${e.grossPay}\n`;
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payroll-${payPeriodId}.csv`
      );
      res.setHeader("Content-Type", "text/csv");

      res.send(csv);
    } catch (err) {
      console.error("❌ CSV export failed", err);
      res.status(500).send("CSV export failed");
    }
  }
);

export default router;
