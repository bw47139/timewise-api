"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.benefitsModuleRouter = void 0;
// src/modules/benefits/router.ts
const express_1 = require("express");
exports.benefitsModuleRouter = (0, express_1.Router)();
exports.benefitsModuleRouter.get("/api/benefits", (_req, res) => {
    res.json({ ok: true });
});
