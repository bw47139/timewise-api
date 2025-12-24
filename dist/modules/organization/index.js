"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const organization_routes_1 = __importDefault(require("./organization.routes"));
/**
 * ------------------------------------------------------
 * Organization Module Entry Point
 * ------------------------------------------------------
 * REQUIRED for autoRouter.ts to mount:
 *   /api/organization
 *
 * DO NOT put logic here.
 * DO NOT rename this file.
 * ------------------------------------------------------
 */
exports.default = organization_routes_1.default;
