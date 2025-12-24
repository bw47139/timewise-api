// src/modules/supervisor/router.ts
import { Router, Request, Response } from "express";

import { verifyToken } from "../../middleware/verifyToken";

import supervisorRouter from "./supervisor.routes";
import supervisorEditRouter from "./supervisor.edit.routes";
import supervisorShiftRouter from "./supervisor.shift.routes";
import supervisorTimesheetRouter from "./supervisor.timesheet.routes";
import supervisorDeleteRouter from "./supervisor.delete.routes";

export const supervisorModuleRouter = Router();

// PROTECTED
supervisorModuleRouter.use("/api/supervisor", verifyToken, supervisorRouter);
supervisorModuleRouter.use("/api/supervisor", verifyToken, supervisorEditRouter);
supervisorModuleRouter.use("/api/supervisor", verifyToken, supervisorShiftRouter);
supervisorModuleRouter.use("/api/supervisor", verifyToken, supervisorTimesheetRouter);
supervisorModuleRouter.use("/api/supervisor", verifyToken, supervisorDeleteRouter);
