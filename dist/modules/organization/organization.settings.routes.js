"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/organization/organization.settings.routes.ts
const express_1 = require("express");
const organization_settings_controller_1 = require("./organization.settings.controller");
const router = (0, express_1.Router)();
// GET /api/organization/me
router.get("/me", organization_settings_controller_1.organizationSettingsController.getProfile);
// PUT /api/organization/update
router.put("/update", organization_settings_controller_1.organizationSettingsController.updateProfile);
exports.default = router;
