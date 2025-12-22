// src/modules/benefits/router.ts
import { Router } from "express";

export const benefitsModuleRouter = Router();

benefitsModuleRouter.get("/api/benefits", (_req, res) => {
  res.json({ ok: true });
});
