"use strict";
// src/modules/clock/clock.face.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const crypto_1 = __importDefault(require("crypto"));
const rekognitionClient_1 = require("../../utils/rekognitionClient");
const payperiod_routes_1 = require("../payperiod/payperiod.routes");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Multer stores uploaded image in memory
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
/**
 * ------------------------------------------------------
 * POST /api/clock/face
 *
 * Multipart form-data:
 *  - photo (file)        REQUIRED
 *  - locationId (number) REQUIRED
 *  - deviceId (string)   REQUIRED (body or header)
 * ------------------------------------------------------
 */
router.post("/face", upload.single("photo"), async (req, res) => {
    try {
        const locationId = Number(req.body.locationId);
        // --------------------------------------------------
        // DEVICE ID (BODY or HEADER)
        // --------------------------------------------------
        const deviceId = req.body.deviceId ||
            req.headers["x-device-id"];
        // -------------------------------
        // 1) Validate incoming data
        // -------------------------------
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                error: "Missing face photo upload",
            });
        }
        if (!locationId || Number.isNaN(locationId)) {
            return res.status(400).json({
                ok: false,
                error: "Invalid or missing locationId",
            });
        }
        if (!deviceId || typeof deviceId !== "string") {
            return res.status(400).json({
                ok: false,
                error: "Missing device ID",
            });
        }
        // -------------------------------
        // 2) Validate registered device
        // -------------------------------
        const device = await prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device || !device.isActive) {
            return res.status(403).json({
                ok: false,
                error: "Unauthorized device",
            });
        }
        if (device.locationId !== locationId) {
            return res.status(403).json({
                ok: false,
                error: "Device not authorized for this location",
            });
        }
        // -------------------------------
        // 3) AWS Rekognition match
        // -------------------------------
        const collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID || "timewise-employees";
        const command = new client_rekognition_1.SearchFacesByImageCommand({
            CollectionId: collectionId,
            Image: { Bytes: req.file.buffer },
            FaceMatchThreshold: 90,
            MaxFaces: 1,
        });
        const searchResult = await rekognitionClient_1.rekognitionClient.send(command);
        const match = searchResult.FaceMatches?.[0];
        // --------------------------------------------------
        // 4) NO MATCH → PIN FALLBACK
        // --------------------------------------------------
        if (!match?.Face?.FaceId) {
            return res.status(200).json({
                ok: false,
                requiresPin: true,
                fallbackToken: crypto_1.default.randomUUID(),
                message: "Face not recognized. Enter PIN.",
            });
        }
        const faceId = match.Face.FaceId;
        // -------------------------------
        // 5) Lookup employee by faceId
        // -------------------------------
        const employee = await prisma.employee.findFirst({
            where: {
                faceId,
                locationId,
                isDeleted: false,
                status: client_1.EmployeeStatus.ACTIVE,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                organizationId: true,
                locationId: true,
            },
        });
        if (!employee) {
            return res.status(404).json({
                ok: false,
                error: "Matched face does not belong to an active employee at this location",
            });
        }
        // ------------------------------------------------------
        // 6) PAY PERIOD LOCK CHECK (NEW — CRITICAL)
        // ------------------------------------------------------
        const now = new Date();
        const locked = await (0, payperiod_routes_1.isDateLockedForOrg)(employee.organizationId, employee.locationId ?? locationId, now);
        if (locked) {
            return res.status(403).json({
                ok: false,
                error: "Pay period is approved/locked. No new punches allowed.",
                code: "PERIOD_LOCKED",
            });
        }
        // -------------------------------
        // 7) Determine next punch type
        // -------------------------------
        const lastPunch = await prisma.punch.findFirst({
            where: { employeeId: employee.id },
            orderBy: { timestamp: "desc" },
        });
        const punchType = lastPunch?.type === "IN" ? "OUT" : "IN";
        // -------------------------------
        // 8) Create punch
        // -------------------------------
        const punch = await prisma.punch.create({
            data: {
                employeeId: employee.id,
                locationId,
                type: punchType,
            },
        });
        // -------------------------------
        // 9) Update device heartbeat
        // -------------------------------
        await prisma.device.update({
            where: { deviceId },
            data: { lastSeenAt: new Date() },
        });
        // -------------------------------
        // 10) Respond to kiosk
        // -------------------------------
        return res.json({
            ok: true,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            action: punchType === "IN" ? "CLOCK_IN" : "CLOCK_OUT",
            timestamp: punch.timestamp,
        });
    }
    catch (error) {
        console.error("❌ Face clock error:", error);
        return res.status(500).json({
            ok: false,
            error: "Face clock server error",
        });
    }
});
exports.default = router;
