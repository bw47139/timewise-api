// src/modules/organization/overtime.controller.ts
import { Request, Response } from "express";

import { overtimeService } from "./overtime.service";

export const overtimeController = {
  async getRules(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

      const rules = await overtimeService.getRules(orgId);
      res.json(rules);
    } catch (err) {
      console.error("overtime getRules error:", err);
      res.status(500).json({ error: "Failed to load overtime rules" });
    }
  },

  async updateRules(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

      const updated = await overtimeService.updateRules(orgId, req.body);
      res.json(updated);
    } catch (err) {
      console.error("overtime updateRules error:", err);
      res.status(500).json({ error: "Failed to update overtime rules" });
    }
  },
};
