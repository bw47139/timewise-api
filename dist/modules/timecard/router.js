"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timecardModuleRouter = void 0;
// src/modules/timecard/router.ts
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const timecard_routes_1 = __importDefault(require("./timecard.routes"));
const timecard_summary_routes_1 = __importDefault(require("./timecard.summary.routes"));
const timecard_detail_routes_1 = __importDefault(require("./timecard.detail.routes"));
exports.timecardModuleRouter = (0, express_1.Router)();
// PROTECTED
exports.timecardModuleRouter.use("/api/timecards", verifyToken_1.verifyToken, timecard_routes_1.default);
exports.timecardModuleRouter.use("/api/timecards", verifyToken_1.verifyToken, timecard_summary_routes_1.default);
exports.timecardModuleRouter.use("/api/timecards", verifyToken_1.verifyToken, timecard_detail_routes_1.default);
