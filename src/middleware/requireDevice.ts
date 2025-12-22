import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
export async function requireDevice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // ✅ Accept deviceId from header OR body
    const deviceId =
      (req.header("x-device-id") as string) ||
      (req.body?.deviceId as string);

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
    (req as any).device = device;

    // 🔄 Update last seen timestamp (non-blocking)
    await prisma.device.update({
      where: { deviceId },
      data: { lastSeenAt: new Date() },
    });

    next();
  } catch (err) {
    console.error("❌ Device validation failed:", err);
    res.status(500).json({
      ok: false,
      error: "Device validation failed",
    });
  }
}
