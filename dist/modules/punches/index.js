"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router_1 = __importDefault(require("./router"));
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/punches
 */
router.use(verifyToken_1.verifyToken);
router.use("/", router_1.default);
exports.default = router;
