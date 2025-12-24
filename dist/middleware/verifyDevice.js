"use strict";
// timewise-api/src/middleware/verifyDevice.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDevice = verifyDevice;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * --------------------------------------------------
 * verifyDevice (KIOSK ENFORCEMENT)
 *
 * - Requires x-device-id header
 * - Auto-registers device on first use (PENDING approval)
 * - Blocks if not approved or disabled
 * - Always updates lastSeenAt heartbeat
 *
 * IMPORTANT:
 * - This middleware is ONLY for public kiosk routes
 * - DO NOT use on admin/dashboard APIs
 * - No JWTs, no cookies, no user auth
 * --------------------------------------------------
 */
async function verifyDevice(req, res, next) {
    try {
        const deviceId = String(req.headers["x-device-id"] || "").trim();
        if (!deviceId) {
            return res.status(400).json({
                error: "MISSING_DEVICE_ID",
                message: "Missing x-device-id header",
            });
        }
        // Location required on first registration
        const locationIdRaw = (req.body?.locationId ?? req.query?.locationId);
        const locationId = locationIdRaw ? Number(locationIdRaw) : NaN;
        // --------------------------------------------------
        // Find or register device
        // --------------------------------------------------
        let device = await prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device) {
            if (Number.isNaN(locationId)) {
                return res.status(400).json({
                    error: "MISSING_LOCATION",
                    message: "locationId is required for first-time kiosk registration",
                });
            }
            device = await prisma.device.create({
                data: {
                    deviceId,
                    locationId,
                    name: null,
                    isApproved: false, // ⛔ admin approval required
                    isActive: true,
                    lastSeenAt: new Date(),
                },
            });
        }
        else {
            // Always update heartbeat
            await prisma.device.update({
                where: { id: device.id },
                data: {
                    lastSeenAt: new Date(),
                    ...(Number.isNaN(locationId) ? {} : { locationId }),
                },
            });
        }
        // --------------------------------------------------
        // Enforce approval + active status
        // --------------------------------------------------
        if (!device.isApproved) {
            return res.status(403).json({
                error: "DEVICE_NOT_APPROVED",
                message: "This kiosk is awaiting administrator approval",
                device: {
                    deviceId: device.deviceId,
                    isApproved: device.isApproved,
                    isActive: device.isActive,
                },
            });
        }
        if (!device.isActive) {
            return res.status(403).json({
                error: "DEVICE_DISABLED",
                message: "This kiosk has been disabled",
            });
        }
        // --------------------------------------------------
        // Inject device context
        // --------------------------------------------------
        req.device = {
            id: device.id,
            deviceId: device.deviceId,
            locationId: device.locationId,
        };
        return next();
    }
    catch (error) {
        console.error("❌ verifyDevice failed:", error);
        return res.status(500).json({
            error: "DEVICE_VERIFICATION_FAILED",
            message: "Device verification failed",
        });
    }
}
