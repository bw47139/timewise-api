"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsModuleRouter = void 0;
// src/modules/reports/router.ts
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const missingPunch_routes_1 = __importDefault(require("./missingPunch.routes"));
const timesheetPdf_routes_1 = __importDefault(require("./timesheetPdf.routes"));
const timesheetDownload_routes_1 = __importDefault(require("./timesheetDownload.routes"));
exports.reportsModuleRouter = (0, express_1.Router)();
// PROTECTED
exports.reportsModuleRouter.use("/api/reports", verifyToken_1.verifyToken, missingPunch_routes_1.default);
exports.reportsModuleRouter.use("/api/reports", verifyToken_1.verifyToken, timesheetPdf_routes_1.default);
exports.reportsModuleRouter.use("/api/reports", verifyToken_1.verifyToken, timesheetDownload_routes_1.default);
