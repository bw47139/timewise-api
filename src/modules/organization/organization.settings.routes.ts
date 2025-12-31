import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { getOrganizationSettingsHandler } from "./organization.settings.controller";

const router = Router();

/* ------------------------------------------------
   GET /api/organization/:id/settings
------------------------------------------------ */
router.get(
  "/:id/settings",
  verifyToken,
  getOrganizationSettingsHandler
);

export default router;
