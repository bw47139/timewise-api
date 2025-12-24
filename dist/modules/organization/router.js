"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationModuleRouter = void 0;
// src/modules/organization/router.ts
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const organization_routes_1 = __importDefault(require("./organization.routes"));
const organization_settings_routes_1 = __importDefault(require("./organization.settings.routes"));
const pay_period_routes_1 = __importDefault(require("./pay-period.routes"));
const overtime_routes_1 = __importDefault(require("./overtime.routes"));
const pto_routes_1 = __importDefault(require("./pto.routes"));
exports.organizationModuleRouter = (0, express_1.Router)();
// PUBLIC: first-time org creation (your existing behavior)
exports.organizationModuleRouter.use("/api/organizations", organization_routes_1.default);
// PROTECTED: org settings
exports.organizationModuleRouter.use("/api/organization", verifyToken_1.verifyToken, organization_settings_routes_1.default);
exports.organizationModuleRouter.use("/api/organization/pay-period", verifyToken_1.verifyToken, pay_period_routes_1.default);
exports.organizationModuleRouter.use("/api/organization/overtime", verifyToken_1.verifyToken, overtime_routes_1.default);
exports.organizationModuleRouter.use("/api/organization/pto", verifyToken_1.verifyToken, pto_routes_1.default);
