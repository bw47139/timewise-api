import { Router, Request, Response } from "express";

import clockFaceRouter from "./clock.face.routes";
import clockPinRouter from "./clock.pin.routes";
import clockLocationsRouter from "./clock.locations.routes";
import clockDeviceRouter from "./clock.device.routes";

import { requireDevice } from "../../middleware/requireDevice";

const router = Router();

/**
 * ======================================================
 * CLOCK ROUTER (/api/clock)
 * ======================================================
 *
 * ⚠️ ABSOLUTE RULES:
 * - NO verifyToken anywhere in this file
 * - Kiosk auth is DEVICE-BASED only
 * - JWT is NOT used for clock routes
 *
 * Order is CRITICAL.
 */

// ------------------------------------------------------
// 1️⃣ DEVICE REGISTRATION (PUBLIC)
// POST /api/clock/device/register
// GET  /api/clock/device/:deviceId
// ------------------------------------------------------
router.use("/device", clockDeviceRouter);

// ------------------------------------------------------
// 2️⃣ PUBLIC LOCATIONS (NO DEVICE REQUIRED)
// GET /api/clock/locations
// ------------------------------------------------------
router.use("/", clockLocationsRouter);

// ------------------------------------------------------
// 3️⃣ DEVICE ENFORCEMENT (FROM HERE DOWN 🔒)
// ------------------------------------------------------
router.use(requireDevice);

// ------------------------------------------------------
// 4️⃣ CLOCK-IN / CLOCK-OUT (DEVICE-PROTECTED)
// ------------------------------------------------------

// POST /api/clock/face
router.use("/", clockFaceRouter);

// POST /api/clock/pin
router.use("/", clockPinRouter);

export default router;
