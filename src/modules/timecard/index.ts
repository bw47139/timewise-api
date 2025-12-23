import { Router } from "express";
import summaryRoutes from "./timecard.summary.routes";
import detailRoutes from "./timecard.detail.routes";
import timecardRoutes from "./timecard.routes";

const router = Router();

/**
 * ------------------------------------------------------
 * Timecard Module Entry Point
 * ------------------------------------------------------
 *
 * AutoRouter mounts this module at:
 *   /api/timecard
 *
 * Routes:
 *   /summary  → /api/timecard/summary
 *   /detail   → /api/timecard/detail
 *   /...      → from timecard.routes.ts
 *
 * ------------------------------------------------------
 */

// HTTP routes
router.use("/", summaryRoutes);
router.use("/", detailRoutes);
router.use("/", timecardRoutes);

/**
 * ------------------------------------------------------
 * Barrel Exports (IMPORTANT)
 * ------------------------------------------------------
 * These allow other modules to safely import business
 * logic without reaching into internal files.
 *
 * Example:
 *   import { getTimecardForRange } from "../timecard";
 * ------------------------------------------------------
 */
export * from "./timecard.service";
export * from "./payPeriod.service";

export default router;
