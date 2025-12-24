// src/modules/audit/router.ts
import { Router, Request, Response } from "express";

import { verifyToken } from "../../middleware/verifyToken";

export const auditModuleRouter = Router();

/**
 * If you add audit routes later:
 * auditModuleRouter.use("/api/audit", verifyToken, auditRoutes);
 */

// Placeholder route so module exists (optional)
auditModuleRouter.get("/api/audit/health", verifyToken, (_req, res) => {
  res.json({ ok: true });
});
