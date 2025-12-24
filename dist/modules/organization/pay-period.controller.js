"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payPeriodController = void 0;
const pay_period_service_1 = require("./pay-period.service");
exports.payPeriodController = {
    async getSettings(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const settings = await pay_period_service_1.payPeriodService.getSettings(orgId);
            res.json(settings);
        }
        catch (err) {
            console.error("payPeriod getSettings error:", err);
            res.status(500).json({ error: "Failed to load pay period settings" });
        }
    },
    async updateSettings(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const updated = await pay_period_service_1.payPeriodService.updateSettings(orgId, req.body);
            res.json(updated);
        }
        catch (err) {
            console.error("payPeriod updateSettings error:", err);
            res.status(500).json({ error: "Failed to update pay period settings" });
        }
    },
};
