import { Router, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";

import payPeriodReportRoutes from "./payPeriodReport.routes";
import payrollSummaryRoutes from "./payrollSummary.routes";

// ✅ NEW: Payroll export routes
import payrollCsvExportRoutes from "./payroll.export.csv.routes";
import payrollPdfExportRoutes from "./payroll.export.pdf.routes";

const router = Router();

/**
 * AUTO-LOADED by autoRouter
 * Base path = /api/payperiod-report
 */

// 🔐 Protect everything under this module
router.use(verifyToken);

// ---------------------------------------------
// Pay Period listing / info
// /api/payperiod-report/payperiod
// ---------------------------------------------
router.use("/payperiod", payPeriodReportRoutes);

// ---------------------------------------------
// Payroll summary (live or snapshot-aware)
// /api/payperiod-report/payroll/summary
// ---------------------------------------------
router.use("/payroll", payrollSummaryRoutes);

// ---------------------------------------------
// Payroll exports (LOCKED payroll only)
// /api/payperiod-report/payroll/export/csv
// /api/payperiod-report/payroll/export/pdf
// ---------------------------------------------
router.use("/payroll", payrollCsvExportRoutes);
router.use("/payroll", payrollPdfExportRoutes);

export default router;
