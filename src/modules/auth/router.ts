// src/modules/auth/router.ts
import { Router } from "express";

import authRoutes from "./auth.routes";

export const authModuleRouter = Router();

// PUBLIC
authModuleRouter.use("/api/auth", authRoutes);
