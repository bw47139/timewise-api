"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const payPeriodReport_routes_1 = __importDefault(require("./payPeriodReport.routes"));
const payrollSummary_routes_1 = __importDefault(require("./payrollSummary.routes"));
// ✅ NEW: Payroll export routes
const payroll_export_csv_routes_1 = __importDefault(require("./payroll.export.csv.routes"));
const payroll_export_pdf_routes_1 = __importDefault(require("./payroll.export.pdf.routes"));
const router = (0, express_1.Router)();
/**
 * AUTO-LOADED by autoRouter
 * Base path = /api/payperiod-report
 */
// 🔐 Protect everything under this module
router.use(verifyToken_1.verifyToken);
// ---------------------------------------------
// Pay Period listing / info
// /api/payperiod-report/payperiod
// ---------------------------------------------
router.use("/payperiod", payPeriodReport_routes_1.default);
// ---------------------------------------------
// Payroll summary (live or snapshot-aware)
// /api/payperiod-report/payroll/summary
// ---------------------------------------------
router.use("/payroll", payrollSummary_routes_1.default);
// ---------------------------------------------
// Payroll exports (LOCKED payroll only)
// /api/payperiod-report/payroll/export/csv
// /api/payperiod-report/payroll/export/pdf
// ---------------------------------------------
router.use("/payroll", payroll_export_csv_routes_1.default);
router.use("/payroll", payroll_export_pdf_routes_1.default);
exports.default = router;
