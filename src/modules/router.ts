// src/modules/router.ts
import { Router } from "express";
import { publicRouter, protectedRouter } from "./autoRouter";

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
export const apiRouter = Router();

// ------------------------------------------------------
// 🌐 PUBLIC ROUTES (NO AUTH)
// ------------------------------------------------------
apiRouter.use(publicRouter);

// ------------------------------------------------------
// 🔒 PROTECTED ROUTES (AUTH ENFORCED UPSTREAM)
// ------------------------------------------------------
apiRouter.use(protectedRouter);

export default apiRouter;
