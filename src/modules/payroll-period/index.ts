// src/modules/payroll-period/index.ts

import { Router, Request, Response } from "express";
import coreRoutes from "./payrollPeriod.routes";
import detailRoutes from "./payrollPeriod.detail.routes";

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

const router = Router();

router.use("/", coreRoutes);
router.use("/", detailRoutes);

export default router;
