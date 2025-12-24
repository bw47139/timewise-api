"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditModuleRouter = void 0;
// src/modules/audit/router.ts
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
exports.auditModuleRouter = (0, express_1.Router)();
/**
 * If you add audit routes later:
 * auditModuleRouter.use("/api/audit", verifyToken, auditRoutes);
 */
// Placeholder route so module exists (optional)
exports.auditModuleRouter.get("/api/audit/health", verifyToken_1.verifyToken, (_req, res) => {
    res.json({ ok: true });
});
