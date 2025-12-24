"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const payperiod_routes_1 = __importDefault(require("./payperiod.routes"));
const router = (0, express_1.Router)();
/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/payperiod
 */
router.use(verifyToken_1.verifyToken);
router.use("/", payperiod_routes_1.default);
exports.default = router;
