// src/modules/benefits/router.ts
import { Router, Request, Response } from "express";

export const benefitsModuleRouter = Router();

benefitsModuleRouter.get("/api/benefits", (_req, res) => {
  res.json({ ok: true });
});
