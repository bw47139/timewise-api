// src/modules/organization/pto.controller.ts
import { Request, Response } from "express";

import { ptoService } from "./pto.service";

export const ptoController = {
  async getSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

      const settings = await ptoService.getSettings(orgId);
      res.json(settings);
    } catch (err) {
      console.error("pto getSettings error:", err);
      res.status(500).json({ error: "Failed to load PTO settings" });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

      const updated = await ptoService.updateSettings(orgId, req.body);
      res.json(updated);
    } catch (err) {
      console.error("pto updateSettings error:", err);
      res.status(500).json({ error: "Failed to update PTO settings" });
    }
  },
};
