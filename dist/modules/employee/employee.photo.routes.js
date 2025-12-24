"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const verifyToken_1 = require("../../middleware/verifyToken");
const s3Client_1 = require("../../utils/s3Client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * Multer config (memory storage)
 * ------------------------------------------------------
 */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});
/**
 * ------------------------------------------------------
 * POST /api/employee/:id/photo
 * Upload or replace employee photo (PUBLIC S3)
 * ------------------------------------------------------
 */
router.post("/:id/photo", verifyToken_1.verifyToken, upload.single("photo"), async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        if (!req.file) {
            return res.status(400).json({ error: "No photo uploaded" });
        }
        const bucket = process.env.AWS_S3_BUCKET;
        if (!bucket) {
            return res.status(500).json({ error: "Missing AWS_S3_BUCKET" });
        }
        // --------------------------------------------------
        // Load employee
        // --------------------------------------------------
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee || employee.isDeleted) {
            return res.status(404).json({ error: "Employee not found" });
        }
        // --------------------------------------------------
        // Delete existing photo (if any)
        // --------------------------------------------------
        if (employee.photoUrl) {
            const oldKey = employee.photoUrl.split(".amazonaws.com/")[1];
            if (oldKey) {
                await s3Client_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: bucket,
                    Key: oldKey,
                }));
            }
        }
        // --------------------------------------------------
        // Build S3 key
        // --------------------------------------------------
        const extension = req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
        const key = `employees/${employee.organizationId}/${employeeId}/photo.${extension}`;
        // --------------------------------------------------
        // Upload to S3 (PUBLIC)
        // --------------------------------------------------
        await s3Client_1.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: "public-read",
        }));
        const photoUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
        // --------------------------------------------------
        // Save URL in DB
        // --------------------------------------------------
        const updated = await prisma.employee.update({
            where: { id: employeeId },
            data: { photoUrl },
            select: {
                id: true,
                photoUrl: true,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        console.error("EMPLOYEE PHOTO UPLOAD ERROR:", error);
        return res
            .status(500)
            .json({ error: "Failed to upload employee photo" });
    }
});
/**
 * ------------------------------------------------------
 * DELETE /api/employee/:id/photo
 * Remove employee photo (S3 + DB)
 * ------------------------------------------------------
 */
router.delete("/:id/photo", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        const bucket = process.env.AWS_S3_BUCKET;
        if (!bucket) {
            return res.status(500).json({ error: "Missing AWS_S3_BUCKET" });
        }
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee || !employee.photoUrl) {
            return res.status(404).json({ error: "Photo not found" });
        }
        const key = employee.photoUrl.split(".amazonaws.com/")[1];
        if (key) {
            await s3Client_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            }));
        }
        await prisma.employee.update({
            where: { id: employeeId },
            data: { photoUrl: null },
        });
        return res.json({ success: true });
    }
    catch (error) {
        console.error("EMPLOYEE PHOTO DELETE ERROR:", error);
        return res
            .status(500)
            .json({ error: "Failed to delete employee photo" });
    }
});
exports.default = router;
