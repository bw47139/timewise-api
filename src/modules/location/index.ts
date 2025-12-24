// src/modules/location/index.ts
import { Router, Request, Response } from "express";

import baseRoutes from "./location.routes";
import detailRoutes from "./location.detail.routes";
import payrollRoutes from "./location.payroll.routes";
import overtimeRoutes from "./location.overtime.routes";
import settingsRoutes from "./location.settings.routes";

const router = Router();

/**
 * Mount all sub-route files for the Location module.
 *
 * AutoRouter will mount this entire module at:
 *   /location
 *
 * So inside each route file:
 *   "/"       becomes "/location"
 *   "/:id"    becomes "/location/:id"
 *   "/list"   becomes "/location/list"
 */

router.use("/", baseRoutes);
router.use("/", detailRoutes);
router.use("/", payrollRoutes);
router.use("/", overtimeRoutes);
router.use("/", settingsRoutes);

export default router;
