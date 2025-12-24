// src/modules/health/router.ts

import { Router, Request, Response } from "express";
import healthRouter from "./health.routes"; // ✅ FIXED: default import

export const healthModuleRouter = Router();

// PUBLIC
healthModuleRouter.use("/api/health", healthRouter);
