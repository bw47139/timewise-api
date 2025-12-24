"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/location/index.ts
const express_1 = require("express");
const location_routes_1 = __importDefault(require("./location.routes"));
const location_detail_routes_1 = __importDefault(require("./location.detail.routes"));
const location_payroll_routes_1 = __importDefault(require("./location.payroll.routes"));
const location_overtime_routes_1 = __importDefault(require("./location.overtime.routes"));
const location_settings_routes_1 = __importDefault(require("./location.settings.routes"));
const router = (0, express_1.Router)();
/**
 * Mount all sub-route files for the Location module.
 *
 * AutoRouter will mount this entire module at:
 *   /location
 *
 * So inside each route file:
 *   "/"       becomes "/location"
 *   "/:id"    becomes "/location/:id"
 *   "/list"   becomes "/location/list"
 */
router.use("/", location_routes_1.default);
router.use("/", location_detail_routes_1.default);
router.use("/", location_payroll_routes_1.default);
router.use("/", location_overtime_routes_1.default);
router.use("/", location_settings_routes_1.default);
exports.default = router;
