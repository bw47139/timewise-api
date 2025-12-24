"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
// src/modules/router.ts
const express_1 = require("express");
const autoRouter_1 = require("./autoRouter");
/**
 * ======================================================
 * API ROUTER (SINGLE ENTRY POINT)
 * ======================================================
 *
 * Combines:
 *  🌐 publicRouter    → NO AUTH (kiosk, health, clock)
 *  🔒 protectedRouter → JWT REQUIRED (dashboard, admin)
 *
 * This router is mounted at /api in server.ts
 * DO NOT prefix /api here
 */
exports.apiRouter = (0, express_1.Router)();
// ------------------------------------------------------
// 🌐 PUBLIC ROUTES (NO AUTH)
// ------------------------------------------------------
exports.apiRouter.use(autoRouter_1.publicRouter);
// ------------------------------------------------------
// 🔒 PROTECTED ROUTES (AUTH ENFORCED UPSTREAM)
// ------------------------------------------------------
exports.apiRouter.use(autoRouter_1.protectedRouter);
exports.default = exports.apiRouter;
