"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overtimeController = void 0;
const overtime_service_1 = require("./overtime.service");
exports.overtimeController = {
    async getRules(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const rules = await overtime_service_1.overtimeService.getRules(orgId);
            res.json(rules);
        }
        catch (err) {
            console.error("overtime getRules error:", err);
            res.status(500).json({ error: "Failed to load overtime rules" });
        }
    },
    async updateRules(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const updated = await overtime_service_1.overtimeService.updateRules(orgId, req.body);
            res.json(updated);
        }
        catch (err) {
            console.error("overtime updateRules error:", err);
            res.status(500).json({ error: "Failed to update overtime rules" });
        }
    },
};
