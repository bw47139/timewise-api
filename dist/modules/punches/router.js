"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const punch_employee_routes_1 = __importDefault(require("./punch.employee.routes"));
const punch_routes_1 = __importDefault(require("./punch.routes"));
const router = (0, express_1.Router)();
/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/punches
 */
router.use("/", punch_routes_1.default);
router.use("/employee", punch_employee_routes_1.default);
exports.default = router;
