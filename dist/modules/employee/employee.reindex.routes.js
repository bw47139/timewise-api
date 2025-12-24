"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const rekognitionClient_1 = require("../../utils/rekognitionClient");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * Reindex ALL employees
 */
router.post("/reindex-all", async (req, res) => {
    console.log("🔄 Starting face reindex...");
    if (!rekognitionClient_1.COLLECTION_ID) {
        return res.status(500).json({
            error: "AWS_REKOGNITION_COLLECTION_ID is missing. Cannot index faces.",
        });
    }
    try {
        const employees = await prisma.employee.findMany();
        const results = [];
        for (const emp of employees) {
            if (!emp.photoUrl)
                continue;
            const url = new URL(emp.photoUrl);
            const bucket = url.hostname.split(".")[0];
            const key = url.pathname.substring(1);
            const cmd = new client_rekognition_1.IndexFacesCommand({
                CollectionId: rekognitionClient_1.COLLECTION_ID, // ✅ FIXED
                Image: { S3Object: { Bucket: bucket, Name: key } },
                ExternalImageId: String(emp.id),
            });
            try {
                const result = await rekognitionClient_1.rekognitionClient.send(cmd);
                console.log(`Indexed face for employee ${emp.id}`);
                results.push({ id: emp.id, result });
            }
            catch (err) {
                console.error(`❌ Error indexing employee ${emp.id}`, err);
            }
        }
        res.json({
            message: "Reindex complete",
            count: results.length,
            results,
        });
    }
    catch (err) {
        console.error("❌ Batch reindex failed:", err);
        res.status(500).json({ error: "Batch reindex failed", details: err });
    }
});
exports.default = router;
