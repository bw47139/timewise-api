"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/organization/pto.routes.ts
const express_1 = require("express");
const pto_controller_1 = require("./pto.controller");
const router = (0, express_1.Router)();
// GET /api/organization/pto
router.get("/", pto_controller_1.ptoController.getSettings);
// PUT /api/organization/pto
router.put("/", pto_controller_1.ptoController.updateSettings);
exports.default = router;
