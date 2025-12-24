// src/modules/auth/router.ts
import { Router, Request, Response } from "express";

import authRoutes from "./auth.routes";

export const authModuleRouter = Router();

// PUBLIC
authModuleRouter.use("/api/auth", authRoutes);
