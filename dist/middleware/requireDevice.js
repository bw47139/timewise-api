"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDevice = requireDevice;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * ======================================================
 * REQUIRE DEVICE MIDDLEWARE (KIOSK SECURITY)
 * ======================================================
 *
 * Accepts deviceId from:
 *  - Header:  x-device-id
 *  - Body:    req.body.deviceId (FormData or JSON)
 *
 * Attaches validated device to:
 *  - req.device
 */
async function requireDevice(req, res, next) {
    try {
        // ✅ Accept deviceId from header OR body
        const deviceId = req.header("x-device-id") ||
            req.body?.deviceId;
        if (!deviceId || typeof deviceId !== "string") {
            return res.status(401).json({
                ok: false,
                error: "Missing device ID",
            });
        }
        const device = await prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device || !device.isActive) {
            return res.status(403).json({
                ok: false,
                error: "Device not authorized",
            });
        }
        // 🔐 Attach device to request
        req.device = device;
        // 🔄 Update last seen timestamp (non-blocking)
        await prisma.device.update({
            where: { deviceId },
            data: { lastSeenAt: new Date() },
        });
        next();
    }
    catch (err) {
        console.error("❌ Device validation failed:", err);
        res.status(500).json({
            ok: false,
            error: "Device validation failed",
        });
    }
}
