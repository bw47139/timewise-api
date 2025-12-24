"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timecard_summary_routes_1 = __importDefault(require("./timecard.summary.routes"));
const timecard_detail_routes_1 = __importDefault(require("./timecard.detail.routes"));
const timecard_routes_1 = __importDefault(require("./timecard.routes"));
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * Timecard Module Entry Point
 * ------------------------------------------------------
 *
 * AutoRouter mounts this module at:
 *   /api/timecard
 *
 * Routes:
 *   /summary  → /api/timecard/summary
 *   /detail   → /api/timecard/detail
 *   /...      → from timecard.routes.ts
 *
 * ------------------------------------------------------
 */
// HTTP routes
router.use("/", timecard_summary_routes_1.default);
router.use("/", timecard_detail_routes_1.default);
router.use("/", timecard_routes_1.default);
/**
 * ------------------------------------------------------
 * Barrel Exports (IMPORTANT)
 * ------------------------------------------------------
 * These allow other modules to safely import business
 * logic without reaching into internal files.
 *
 * Example:
 *   import { getTimecardForRange } from "../timecard";
 * ------------------------------------------------------
 */
__exportStar(require("./timecard.service"), exports);
__exportStar(require("./payperiod.service"), exports);
exports.default = router;
