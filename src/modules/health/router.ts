// src/modules/health/router.ts
import { Router } from "express";

import { healthRouter } from "./health.routes";

export const healthModuleRouter = Router();

// PUBLIC
healthModuleRouter.use("/api/health", healthRouter);
