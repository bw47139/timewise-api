// src/modules/organization/organization.settings.controller.ts
import { Request, Response } from "express";

import { organizationSettingsService } from "./organization.settings.service";

export const organizationSettingsController = {
  async getProfile(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;

      if (!orgId) {
        return res.status(401).json({ error: "Unauthorized: no organizationId" });
      }

      const profile = await organizationSettingsService.getProfile(orgId);

      if (!profile) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(profile);
    } catch (err) {
      console.error("Error in getProfile:", err);
      res.status(500).json({ error: "Failed to load company profile" });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.organizationId;

      if (!orgId) {
        return res.status(401).json({ error: "Unauthorized: no organizationId" });
      }

      const data = req.body;

      const updated = await organizationSettingsService.updateProfile(orgId, data);

      res.json(updated);
    } catch (err) {
      console.error("Error in updateProfile:", err);
      res.status(500).json({ error: "Failed to update company profile" });
    }
  },
};
