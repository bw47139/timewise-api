// src/modules/organization/organization.settings.routes.ts
import { Router, Request, Response } from "express";

import { organizationSettingsController } from "./organization.settings.controller";

const router = Router();

// GET /api/organization/me
router.get("/me", organizationSettingsController.getProfile);

// PUT /api/organization/update
router.put("/update", organizationSettingsController.updateProfile);

export default router;
