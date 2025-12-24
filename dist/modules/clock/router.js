"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clock_face_routes_1 = __importDefault(require("./clock.face.routes"));
const clock_pin_routes_1 = __importDefault(require("./clock.pin.routes"));
const clock_locations_routes_1 = __importDefault(require("./clock.locations.routes"));
const clock_device_routes_1 = __importDefault(require("./clock.device.routes"));
const requireDevice_1 = require("../../middleware/requireDevice");
const router = (0, express_1.Router)();
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
router.use("/device", clock_device_routes_1.default);
// ------------------------------------------------------
// 2️⃣ PUBLIC LOCATIONS (NO DEVICE REQUIRED)
// GET /api/clock/locations
// ------------------------------------------------------
router.use("/", clock_locations_routes_1.default);
// ------------------------------------------------------
// 3️⃣ DEVICE ENFORCEMENT (FROM HERE DOWN 🔒)
// ------------------------------------------------------
router.use(requireDevice_1.requireDevice);
// ------------------------------------------------------
// 4️⃣ CLOCK-IN / CLOCK-OUT (DEVICE-PROTECTED)
// ------------------------------------------------------
// POST /api/clock/face
router.use("/", clock_face_routes_1.default);
// POST /api/clock/pin
router.use("/", clock_pin_routes_1.default);
exports.default = router;
