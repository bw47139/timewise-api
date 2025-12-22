import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * ======================================================
 * DEVICE REGISTRATION (KIOSK)
 * ======================================================
 * STEP C — Device Enforcement (MVP)
 *
 * Rules:
 * - Device auto-registers if missing
 * - Device auto-activates (TEMP)
 * - Device auto-binds to a location (TEMP)
 *
 * NOTE:
 * This router is mounted at:
 *   /api/clock/device
 * So paths here MUST NOT include /device again
 * ======================================================
 */

/**
 * ------------------------------------------------------
 * POST /api/clock/device/register
 * ------------------------------------------------------
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        ok: false,
        error: "Missing deviceId",
      });
    }

    let device = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          deviceId,
          isActive: true,   // ✅ AUTO-ACTIVE (MVP)
          locationId: 1,    // 🔴 TEMP DEFAULT LOCATION
        },
      });
    }

    return res.json({
      ok: true,
      deviceId: device.deviceId,
      isActive: device.isActive,
      locationId: device.locationId,
    });
  } catch (error) {
    console.error("❌ Device register error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to register device",
    });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/clock/device/:deviceId
 * ------------------------------------------------------
 */
router.get("/:deviceId", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        ok: false,
        error: "Missing deviceId",
      });
    }

    let device = await prisma.device.findUnique({
      where: { deviceId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          deviceId,
          isActive: true,   // ✅ AUTO-APPROVE (MVP)
          locationId: 1,    // 🔴 TEMP DEFAULT LOCATION
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    if (!device.isActive) {
      return res.status(403).json({
        ok: false,
        error: "Device not authorized",
      });
    }

    if (!device.location) {
      return res.status(403).json({
        ok: false,
        error: "Device not assigned to location",
      });
    }

    return res.json({
      ok: true,
      deviceId: device.deviceId,
      location: device.location,
    });
  } catch (error) {
    console.error("❌ Device lookup error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to resolve device",
    });
  }
});

export default router;
