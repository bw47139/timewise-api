"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationSettingsController = void 0;
const organization_settings_service_1 = require("./organization.settings.service");
exports.organizationSettingsController = {
    async getProfile(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId) {
                return res.status(401).json({ error: "Unauthorized: no organizationId" });
            }
            const profile = await organization_settings_service_1.organizationSettingsService.getProfile(orgId);
            if (!profile) {
                return res.status(404).json({ error: "Organization not found" });
            }
            res.json(profile);
        }
        catch (err) {
            console.error("Error in getProfile:", err);
            res.status(500).json({ error: "Failed to load company profile" });
        }
    },
    async updateProfile(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId) {
                return res.status(401).json({ error: "Unauthorized: no organizationId" });
            }
            const data = req.body;
            const updated = await organization_settings_service_1.organizationSettingsService.updateProfile(orgId, data);
            res.json(updated);
        }
        catch (err) {
            console.error("Error in updateProfile:", err);
            res.status(500).json({ error: "Failed to update company profile" });
        }
    },
};
