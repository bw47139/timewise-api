// src/modules/organization/pay-period.controller.ts
import { Request, Response } from "express";

import { payPeriodService } from "./pay-period.service";

export const payPeriodController = {
  async getSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const settings = await payPeriodService.getSettings(orgId);
      res.json(settings);
    } catch (err) {
      console.error("payPeriod getSettings error:", err);
      res.status(500).json({ error: "Failed to load pay period settings" });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updated = await payPeriodService.updateSettings(orgId, req.body);
      res.json(updated);
    } catch (err) {
      console.error("payPeriod updateSettings error:", err);
      res.status(500).json({ error: "Failed to update pay period settings" });
    }
  },
};
