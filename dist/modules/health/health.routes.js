"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * GET /api/health
 * Public health check (NO AUTH)
 * ------------------------------------------------------
 */
router.get("/", (_req, res) => {
    return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
