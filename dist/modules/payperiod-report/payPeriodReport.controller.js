"use strict";
// src/modules/payperiod-report/payPeriodReport.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayPeriodSummaryHandler = getPayPeriodSummaryHandler;
const payPeriodReport_service_1 = require("./payPeriodReport.service");
async function getPayPeriodSummaryHandler(req, res) {
    try {
        const organizationId = Number(req.params.organizationId);
        const employeeId = Number(req.query.employeeId);
        const dateParam = req.query.date;
        const refDate = dateParam ? new Date(dateParam) : new Date();
        if (isNaN(organizationId)) {
            return res.status(400).json({ error: "Invalid organizationId" });
        }
        if (!employeeId || isNaN(employeeId)) {
            return res.status(400).json({ error: "employeeId is required" });
        }
        const report = await (0, payPeriodReport_service_1.generatePayPeriodSummary)(organizationId, employeeId, refDate);
        if (!report) {
            return res.status(404).json({ error: "Organization not found" });
        }
        res.json(report);
    }
    catch (err) {
        console.error("Pay Period Summary Error:", err);
        res.status(500).json({ error: "Failed to generate pay period summary" });
    }
}
