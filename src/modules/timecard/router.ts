// src/modules/timecard/router.ts
import { Router, Request, Response } from "express";

import { verifyToken } from "../../middleware/verifyToken";

import timecardRouter from "./timecard.routes";
import timecardSummaryRouter from "./timecard.summary.routes";
import timecardDetailRouter from "./timecard.detail.routes";

export const timecardModuleRouter = Router();

// PROTECTED
timecardModuleRouter.use("/api/timecards", verifyToken, timecardRouter);
timecardModuleRouter.use("/api/timecards", verifyToken, timecardSummaryRouter);
timecardModuleRouter.use("/api/timecards", verifyToken, timecardDetailRouter);
