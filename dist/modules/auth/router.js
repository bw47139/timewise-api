"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authModuleRouter = void 0;
// src/modules/auth/router.ts
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
exports.authModuleRouter = (0, express_1.Router)();
// PUBLIC
exports.authModuleRouter.use("/api/auth", auth_routes_1.default);
