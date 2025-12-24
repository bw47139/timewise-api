"use strict";
// src/modules/timecard/timecard.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeeTimecard = getEmployeeTimecard;
const dayjs_1 = __importDefault(require("dayjs"));
const timecard_service_1 = require("./timecard.service");
/**
 * ------------------------------------------------------
 * GET /api/timecard/employee/:id
 *
 * Query:
 *   ?start=YYYY-MM-DD
 *   ?end=YYYY-MM-DD
 * ------------------------------------------------------
 */
async function getEmployeeTimecard(req, res) {
    try {
        const employeeId = Number(req.params.id);
        const { start, end } = req.query;
        if (!employeeId || Number.isNaN(employeeId)) {
            return res.status(400).json({ error: "Invalid employeeId" });
        }
        if (!start || !end) {
            return res.status(400).json({
                error: "start and end query params are required (YYYY-MM-DD)",
            });
        }
        // --------------------------------------------------
        // Convert query params → ISO dates (STRICT)
        // --------------------------------------------------
        const startDate = (0, dayjs_1.default)(String(start)).startOf("day");
        const endDate = (0, dayjs_1.default)(String(end)).endOf("day");
        if (!startDate.isValid() || !endDate.isValid()) {
            return res.status(400).json({
                error: "Invalid date format. Use YYYY-MM-DD",
            });
        }
        // --------------------------------------------------
        // Delegate ALL logic to service
        // --------------------------------------------------
        const result = await timecard_service_1.timecardService.getSummary(employeeId, startDate.toISOString(), endDate.toISOString());
        return res.json(result);
    }
    catch (err) {
        console.error("Timecard controller error:", err);
        return res.status(500).json({
            error: "Failed to load timecard",
        });
    }
}
