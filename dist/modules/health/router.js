"use strict";
// src/modules/health/router.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthModuleRouter = void 0;
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes")); // ✅ FIXED: default import
exports.healthModuleRouter = (0, express_1.Router)();
// PUBLIC
exports.healthModuleRouter.use("/api/health", health_routes_1.default);
