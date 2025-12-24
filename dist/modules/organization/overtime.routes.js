"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/organization/overtime.routes.ts
const express_1 = require("express");
const overtime_controller_1 = require("./overtime.controller");
const router = (0, express_1.Router)();
// GET /api/organization/overtime
router.get("/", overtime_controller_1.overtimeController.getRules);
// PUT /api/organization/overtime
router.put("/", overtime_controller_1.overtimeController.updateRules);
exports.default = router;
