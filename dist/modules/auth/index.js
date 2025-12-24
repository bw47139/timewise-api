"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_routes_1 = __importDefault(require("./auth.routes"));
/**
 * ------------------------------------------------------
 * Auth Module Entry Point
 * ------------------------------------------------------
 * This file is REQUIRED for autoRouter.ts to mount:
 *   /api/auth
 *
 * DO NOT put logic here.
 * DO NOT rename this file.
 * ------------------------------------------------------
 */
exports.default = auth_routes_1.default;
