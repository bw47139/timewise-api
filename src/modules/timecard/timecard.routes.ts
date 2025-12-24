// src/modules/timecard/timecard.routes.ts
// CANONICAL ROUTES FILE — NO BUSINESS LOGIC

import { Router, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { getEmployeeTimecard } from "./timecard.controller";

const router = Router();

/**
 * ------------------------------------------------------
 * GET /api/timecard/employee/:id
 *
 * Query:
 *   ?start=YYYY-MM-DD
 *   ?end=YYYY-MM-DD
 * ------------------------------------------------------
 */
router.get(
  "/employee/:id",
  verifyToken,
  getEmployeeTimecard
);

export default router;
