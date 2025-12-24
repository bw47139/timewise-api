"use strict";
// src/modules/timecard/timecard.routes.ts
// CANONICAL ROUTES FILE — NO BUSINESS LOGIC
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const timecard_controller_1 = require("./timecard.controller");
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * GET /api/timecard/employee/:id
 *
 * Query:
 *   ?start=YYYY-MM-DD
 *   ?end=YYYY-MM-DD
 * ------------------------------------------------------
 */
router.get("/employee/:id", verifyToken_1.verifyToken, timecard_controller_1.getEmployeeTimecard);
exports.default = router;
