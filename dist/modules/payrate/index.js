"use strict";
// src/modules/payrate/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payrate_routes_1 = __importDefault(require("./payrate.routes"));
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
router.use(verifyToken_1.verifyToken);
router.use("/", payrate_routes_1.default);
exports.default = router;
