// src/modules/payperiod-report/payroll.export.pdf.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();
const router = Router();

/**
 * -------------------------------------------------
 * GET /api/payperiod-report/payroll/export/pdf
 * Query: payPeriodId
 * -------------------------------------------------
 */
router.get(
  "/export/pdf",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const payPeriodId = Number(req.query.payPeriodId);

      // ✅ SAFELY READ AUTH CONTEXT
      const auth =
        (req as any).auth ??
        (req as any).user ??
        null;

      if (!auth || !auth.organizationId) {
        return res.status(401).send("Unauthorized");
      }

      const organizationId = Number(auth.organizationId);

      if (!payPeriodId) {
        return res.status(400).send("payPeriodId required");
      }

      // 🔒 Must be locked payroll
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

      if (!data || !Array.isArray(data.employees)) {
        return res
          .status(500)
          .send("Invalid payroll snapshot");
      }

      // -----------------------------
      // PDF SETUP
      // -----------------------------
      const doc = new PDFDocument({ margin: 40 });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payroll-${payPeriodId}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      // Title
      doc
        .fontSize(18)
        .text("Payroll Register", { align: "center" });
      doc.moveDown();

      // Employees
      for (const e of data.employees) {
        const regular = Number(e.regularHours ?? 0);
        const ot = Number(e.overtimeHours ?? 0);
        const dt = Number(e.doubletimeHours ?? 0);
        const pto = Number(e.ptoHours ?? 0);
        const rate = Number(e.rate ?? 0);
        const gross = Number(e.grossPay ?? 0);

        doc
          .fontSize(12)
          .text(e.name ?? "Unknown Employee", {
            underline: true,
          });

        doc.fontSize(10).text(
          `Regular: ${regular}  OT: ${ot}  DT: ${dt}  PTO: ${pto}`
        );

        doc.text(
          `Rate: $${rate.toFixed(2)}   Gross: $${gross.toFixed(2)}`
        );

        doc.moveDown(0.5);
      }

      // Totals
      const totalGross = Number(
        data.summary?.totalGrossPay ?? 0
      );

      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `TOTAL GROSS PAY: $${totalGross.toFixed(2)}`,
          { align: "right" }
        );

      doc.end();
    } catch (err) {
      console.error("❌ PDF export failed:", err);
      res.status(500).send("PDF export failed");
    }
  }
);

export default router;
