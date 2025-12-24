"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const verifyToken_1 = require("../../middleware/verifyToken");
const rekognition_1 = require("../../utils/rekognition");
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * Multer setup (memory storage)
 */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
/**
 * ------------------------------------------------------
 * POST /api/face/enroll/:employeeId
 * Admin enrolls employee face using PHOTO
 * ------------------------------------------------------
 */
router.post("/enroll/:employeeId", verifyToken_1.verifyToken, upload.single("photo"), async (req, res) => {
    try {
        const employeeId = Number(req.params.employeeId);
        if (!employeeId) {
            return res.status(400).json({ error: "Invalid employeeId" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Photo file is required" });
        }
        // 1️⃣ Validate employee
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                organizationId: req.user.organizationId,
                isDeleted: false,
            },
        });
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        // 2️⃣ Send image to Rekognition
        const command = new client_rekognition_1.IndexFacesCommand({
            CollectionId: rekognition_1.COLLECTION_ID,
            Image: {
                Bytes: req.file.buffer,
            },
            ExternalImageId: `employee-${employeeId}`,
            DetectionAttributes: [],
        });
        const result = await rekognition_1.rekognitionClient.send(command);
        if (!result.FaceRecords || result.FaceRecords.length === 0) {
            return res.status(400).json({
                error: "No face detected in image",
            });
        }
        const faceId = result.FaceRecords[0].Face?.FaceId;
        if (!faceId) {
            return res.status(400).json({
                error: "FaceId not generated",
            });
        }
        // 3️⃣ Save FaceId to employee
        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                faceId,
                faceEnabled: true,
            },
        });
        return res.json({
            success: true,
            employeeId,
            faceId,
        });
    }
    catch (error) {
        console.error("❌ Face enrollment failed:", error);
        return res.status(500).json({
            error: "Face enrollment failed",
        });
    }
});
exports.default = router;
