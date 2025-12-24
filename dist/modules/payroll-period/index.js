"use strict";
// src/modules/payroll-period/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payrollPeriod_routes_1 = __importDefault(require("./payrollPeriod.routes"));
const payrollPeriod_detail_routes_1 = __importDefault(require("./payrollPeriod.detail.routes"));
/**
 * Auto-mounted by autoRouter.ts at:
 *   /api/payroll-period
 *
 * So routes in these files become:
 *   GET /           -> list periods (existing core routes)
 *   POST /generate  -> generate periods (existing)
 *   POST /:id/supervisor-approve  (existing)
 *   POST /:id/admin-lock          (existing)
 *   POST /:id/unlock              (existing)
 *
 * PLUS the new detail routes:
 *   GET    /:id
 *   GET    /:id/employees
 *   GET    /:id/employees/:employeeId/punches
 *   POST   /:id/pdf-summary
 */
const router = (0, express_1.Router)();
router.use("/", payrollPeriod_routes_1.default);
router.use("/", payrollPeriod_detail_routes_1.default);
exports.default = router;
