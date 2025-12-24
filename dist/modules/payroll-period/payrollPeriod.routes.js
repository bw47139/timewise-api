"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const payrollPeriod_service_1 = require("./payrollPeriod.service");
const router = (0, express_1.Router)();
/** GET /api/payroll-period */
router.get("/", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const { organizationId } = req.user;
        const locationId = Number(req.query.locationId);
        const periods = await (0, payrollPeriod_service_1.listPayrollPeriods)(organizationId, locationId);
        return res.json(periods);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to load payroll periods" });
    }
});
/** POST /api/payroll-period/generate */
router.post("/generate", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { locationId, anchorDate } = req.body;
        const created = await (0, payrollPeriod_service_1.generateBiWeekly)(organizationId, Number(locationId), new Date(anchorDate));
        return res.json({ ok: true, periods: created });
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to generate periods" });
    }
});
/** POST /api/payroll-period/:id/supervisor-approve */
router.post("/:id/supervisor-approve", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const periodId = Number(req.params.id);
        const user = req.user;
        const period = await (0, payrollPeriod_service_1.supervisorApprove)(periodId, user.id);
        return res.json({ ok: true, period });
    }
    catch (err) {
        return res.status(500).json({ error: "Failed supervisor approval" });
    }
});
/** POST /api/payroll-period/:id/admin-lock */
router.post("/:id/admin-lock", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const periodId = Number(req.params.id);
        const user = req.user;
        const period = await (0, payrollPeriod_service_1.adminLock)(periodId, user.id);
        return res.json({ ok: true, period });
    }
    catch (err) {
        return res.status(500).json({ error: "Failed admin lock" });
    }
});
/** POST /api/payroll-period/:id/unlock */
router.post("/:id/unlock", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const periodId = Number(req.params.id);
        const period = await (0, payrollPeriod_service_1.unlockPeriod)(periodId);
        return res.json({ ok: true, period });
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to unlock period" });
    }
});
exports.default = router;
