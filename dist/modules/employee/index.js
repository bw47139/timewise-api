"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_routes_1 = __importDefault(require("./employee.routes"));
const employee_status_routes_1 = __importDefault(require("./employee.status.routes"));
const employee_photo_routes_1 = __importDefault(require("./employee.photo.routes"));
const payrate_routes_1 = __importDefault(require("./payrate.routes"));
const employee_documents_routes_1 = __importDefault(require("./employee.documents.routes"));
const employee_notes_routes_1 = __importDefault(require("./employee.notes.routes"));
const employee_activity_routes_1 = __importDefault(require("./employee.activity.routes"));
const employee_terminate_routes_1 = __importDefault(require("./employee.terminate.routes"));
const employee_punches_routes_1 = __importDefault(require("./employee.punches.routes")); // ✅ New from your version
const employee_emergency_routes_1 = __importDefault(require("./employee.emergency.routes")); // ✅ NEW (Emergency Contacts)
/**
 * ------------------------------------------------------
 * Employee Module Entry Point
 * ------------------------------------------------------
 * Auto-mounted by autoRouter.ts at:
 *   /api/employee
 *
 * DO NOT prefix routes with /employee here
 * ------------------------------------------------------
 */
const router = (0, express_1.Router)();
/**
 * -----------------------------
 * Core Employee CRUD
 * -----------------------------
 * GET    /api/employee
 * POST   /api/employee
 * GET    /api/employee/:id
 */
router.use("/", employee_routes_1.default);
/**
 * -----------------------------
 * Status & Termination
 * -----------------------------
 */
router.use("/", employee_status_routes_1.default);
router.use("/", employee_terminate_routes_1.default);
/**
 * -----------------------------
 * Photo Upload
 * -----------------------------
 */
router.use("/", employee_photo_routes_1.default);
/**
 * -----------------------------
 * Pay Rates
 * -----------------------------
 * GET    /api/employee/:id/payrates
 * POST   /api/employee/:id/payrates
 * PUT    /api/employee/payrates/:rateId
 * DELETE /api/employee/payrates/:rateId
 */
router.use("/", payrate_routes_1.default);
/**
 * -----------------------------
 * Notes & Documents
 * -----------------------------
 * GET/POST/DELETE Notes
 * GET/POST/DELETE Documents
 */
router.use("/", employee_notes_routes_1.default);
router.use("/", employee_documents_routes_1.default);
/**
 * -----------------------------
 * Emergency Contacts  ⭐ NEW
 * -----------------------------
 * GET /api/employee/:id/emergency
 * POST /api/employee/:id/emergency
 * DELETE /api/employee/:id/emergency/:contactId
 */
router.use("/", employee_emergency_routes_1.default);
/**
 * -----------------------------
 * Activity Log
 * -----------------------------
 * GET /api/employee/:id/activity
 */
router.use("/", employee_activity_routes_1.default);
/**
 * -----------------------------
 * Punch History
 * -----------------------------
 * GET /api/employee/:id/punches
 */
router.use("/", employee_punches_routes_1.default);
exports.default = router;
