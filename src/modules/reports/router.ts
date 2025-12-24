// src/modules/reports/router.ts
import { Router, Request, Response } from "express";

import { verifyToken } from "../../middleware/verifyToken";

import missingPunchRouter from "./missingPunch.routes";
import timesheetPdfRouter from "./timesheetPdf.routes";
import timesheetDownloadRoutes from "./timesheetDownload.routes";

export const reportsModuleRouter = Router();

// PROTECTED
reportsModuleRouter.use("/api/reports", verifyToken, missingPunchRouter);
reportsModuleRouter.use("/api/reports", verifyToken, timesheetPdfRouter);
reportsModuleRouter.use("/api/reports", verifyToken, timesheetDownloadRoutes);
