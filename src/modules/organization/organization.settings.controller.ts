import { Request, Response } from "express";
import { getOrganizationSettings } from "./organization.settings.service";

/* ---------------------------------------------
   GET /api/organization/:id/settings
--------------------------------------------- */
export async function getOrganizationSettingsHandler(
  req: Request,
  res: Response
) {
  try {
    const organizationId = Number(req.params.id);

    if (isNaN(organizationId)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }

    const settings = await getOrganizationSettings(organizationId);

    if (!settings) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(settings);
  } catch (error) {
    console.error("Get Organization Settings Error:", error);
    return res.status(500).json({
      error: "Failed to fetch organization settings",
    });
  }
}
