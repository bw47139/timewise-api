"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/employee/employee.documents.routes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const prisma_1 = require("../../prisma");
const verifyToken_1 = require("../../middleware/verifyToken");
const s3Client_1 = require("../../utils/s3Client");
const router = (0, express_1.Router)();
// Memory upload → S3
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const BUCKET = process.env.AWS_S3_BUCKET;
// ------------------------------
// Helper: Org
// ------------------------------
function getOrgId(req) {
    const user = req.user;
    if (!user || !user.organizationId)
        return null;
    return Number(user.organizationId);
}
// ------------------------------
// Helper: Ensure employee belongs to org
// ------------------------------
async function getEmployee(employeeId, orgId) {
    return prisma_1.prisma.employee.findFirst({
        where: {
            id: employeeId,
            organizationId: orgId,
        },
    });
}
// ------------------------------------------------------
// GET /api/employees/:id/documents
// ------------------------------------------------------
router.get("/:id/documents", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId)
            return res.status(401).json({ error: "Unauthorized" });
        const employeeId = Number(req.params.id);
        if (Number.isNaN(employeeId))
            return res.status(400).json({ error: "Invalid employee id" });
        const employee = await getEmployee(employeeId, orgId);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });
        const docs = await prisma_1.prisma.employeeDocument.findMany({
            where: { employeeId },
            orderBy: { createdAt: "desc" },
        });
        return res.json(docs);
    }
    catch (err) {
        console.error("GET documents error:", err);
        return res.status(500).json({ error: "Failed to load documents" });
    }
});
// ------------------------------------------------------
// POST /api/employees/:id/documents
// Upload to S3 + DB record
// ------------------------------------------------------
router.post("/:id/documents", verifyToken_1.verifyToken, upload.single("file"), async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId)
            return res.status(401).json({ error: "Unauthorized" });
        if (!BUCKET)
            return res
                .status(500)
                .json({ error: "AWS_S3_BUCKET not configured" });
        const employeeId = Number(req.params.id);
        if (Number.isNaN(employeeId))
            return res.status(400).json({ error: "Invalid employee id" });
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });
        const employee = await getEmployee(employeeId, orgId);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });
        // Sanitize original file name
        const originalName = req.file.originalname.replace(/\s+/g, "_");
        const fileType = req.file.mimetype || "application/octet-stream";
        // Organize S3 path by Org → Employee
        const key = `employee-documents/${orgId}/${employeeId}/${Date.now()}-${originalName}`;
        const cmd = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: fileType,
            ACL: "public-read",
        });
        await s3Client_1.s3Client.send(cmd);
        const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;
        const doc = await prisma_1.prisma.employeeDocument.create({
            data: {
                employeeId,
                fileName: originalName,
                fileType,
                fileUrl,
            },
        });
        return res.status(201).json(doc);
    }
    catch (err) {
        console.error("UPLOAD document error:", err);
        return res.status(500).json({ error: "Failed to upload document" });
    }
});
// ------------------------------------------------------
// DELETE /api/employees/:id/documents/:docId
// Deletes S3 file + DB record
// ------------------------------------------------------
router.delete("/:id/documents/:docId", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId)
            return res.status(401).json({ error: "Unauthorized" });
        const employeeId = Number(req.params.id);
        const docId = Number(req.params.docId);
        if (Number.isNaN(employeeId) || Number.isNaN(docId))
            return res.status(400).json({ error: "Invalid id" });
        const doc = await prisma_1.prisma.employeeDocument.findFirst({
            where: {
                id: docId,
                employeeId,
                employee: { organizationId: orgId },
            },
        });
        if (!doc)
            return res.status(404).json({ error: "Document not found" });
        if (!BUCKET)
            return res
                .status(500)
                .json({ error: "AWS_S3_BUCKET not configured" });
        // Extract key from fileUrl
        const split = doc.fileUrl.split(".com/");
        if (split.length < 2) {
            console.error("Could not parse S3 key:", doc.fileUrl);
        }
        else {
            const key = split[1];
            await s3Client_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: BUCKET,
                Key: key,
            }));
        }
        await prisma_1.prisma.employeeDocument.delete({
            where: { id: docId },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("DELETE document error:", err);
        return res.status(500).json({ error: "Failed to delete document" });
    }
});
exports.default = router;
