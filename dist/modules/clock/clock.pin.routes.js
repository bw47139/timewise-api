"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
/**
 * ------------------------------------------------------
 * POST /api/clock/pin
 *
 * Body (JSON):
 *  - pin (string)                 REQUIRED
 *  - fallbackToken (string)       OPTIONAL
 *  - locationId (number)          REQUIRED if no fallbackToken
 * ------------------------------------------------------
 */
router.post("/pin", async (req, res) => {
    try {
        const { pin, fallbackToken, locationId } = req.body;
        if (!pin || String(pin).trim().length === 0) {
            return res.status(400).json({
                error: "PIN is required",
            });
        }
        // --------------------------------------------------
        // Resolve locationId
        // --------------------------------------------------
        let resolvedLocationId = null;
        if (fallbackToken) {
            try {
                const decoded = jsonwebtoken_1.default.verify(fallbackToken, JWT_SECRET);
                resolvedLocationId = Number(decoded.locationId);
            }
            catch {
                return res.status(401).json({
                    error: "Invalid or expired fallback token",
                });
            }
        }
        else if (locationId != null) {
            resolvedLocationId = Number(locationId);
        }
        if (!resolvedLocationId || Number.isNaN(resolvedLocationId)) {
            return res.status(400).json({
                error: "locationId is required",
            });
        }
        const normalizedPin = String(pin).trim();
        // --------------------------------------------------
        // DEBUG (keep for now)
        // --------------------------------------------------
        console.log("🔐 PIN ATTEMPT", {
            pin: normalizedPin,
            locationId: resolvedLocationId,
        });
        // --------------------------------------------------
        // Find employee by PIN (location-scoped)
        // --------------------------------------------------
        const employee = await prisma.employee.findFirst({
            where: {
                pin: normalizedPin,
                locationId: resolvedLocationId,
                isDeleted: false,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                locationId: true,
            },
        });
        if (!employee) {
            return res.status(404).json({
                error: "Invalid PIN",
            });
        }
        // --------------------------------------------------
        // Determine next punch type
        // --------------------------------------------------
        const lastPunch = await prisma.punch.findFirst({
            where: { employeeId: employee.id },
            orderBy: { timestamp: "desc" },
            select: { type: true },
        });
        const punchType = !lastPunch || lastPunch.type === "OUT" ? "IN" : "OUT";
        // --------------------------------------------------
        // Create punch
        // --------------------------------------------------
        const punch = await prisma.punch.create({
            data: {
                employeeId: employee.id,
                locationId: employee.locationId,
                type: punchType,
                timestamp: new Date(),
            },
        });
        // --------------------------------------------------
        // ✅ CANONICAL SUCCESS RESPONSE (KIOSK CONTRACT)
        // --------------------------------------------------
        return res.json({
            employeeName: `${employee.firstName} ${employee.lastName}`,
            punchType, // "IN" | "OUT"
            punchedAt: punch.timestamp,
        });
    }
    catch (error) {
        console.error("❌ PIN punch failed:", error);
        return res.status(500).json({
            error: "PIN punch failed",
        });
    }
});
exports.default = router;
