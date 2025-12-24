"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ptoController = void 0;
const pto_service_1 = require("./pto.service");
exports.ptoController = {
    async getSettings(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const settings = await pto_service_1.ptoService.getSettings(orgId);
            res.json(settings);
        }
        catch (err) {
            console.error("pto getSettings error:", err);
            res.status(500).json({ error: "Failed to load PTO settings" });
        }
    },
    async updateSettings(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const updated = await pto_service_1.ptoService.updateSettings(orgId, req.body);
            res.json(updated);
        }
        catch (err) {
            console.error("pto updateSettings error:", err);
            res.status(500).json({ error: "Failed to update PTO settings" });
        }
    },
};
