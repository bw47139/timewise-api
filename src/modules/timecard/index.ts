// src/modules/timecard/index.ts

import { Router } from "express";
import summaryRoutes from "./timecard.summary.routes";
import detailRoutes from "./timecard.detail.routes";
import timecardRoutes from "./timecard.routes";

const router = Router();

/**
 * AutoRouter will mount this module at:
 *     /api/timecard
 *
 * So:
 *     /summary → /api/timecard/summary
 *     /detail →   /api/timecard/detail
 *     /...anything inside your route files
 */

router.use("/", summaryRoutes);
router.use("/", detailRoutes);
router.use("/", timecardRoutes);

export default router;
