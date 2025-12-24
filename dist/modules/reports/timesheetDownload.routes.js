"use strict";
// src/modules/reports/timesheetDownload.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client_1 = require("../../utils/s3Client");
const router = (0, express_1.Router)();
/**
 * ----------------------------------------------------------
 * GET /api/reports/timesheet-download?s3Key=...
 *
 * Downloads a timesheet PDF from S3
 * ----------------------------------------------------------
 */
router.get("/timesheet-download", async (req, res) => {
    try {
        const s3Key = req.query.s3Key;
        if (!s3Key) {
            return res.status(400).json({
                message: "Missing s3Key parameter",
            });
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key,
        });
        const response = await s3Client_1.s3Client.send(command);
        if (!response.Body) {
            return res.status(404).json({
                message: "File not found in S3",
            });
        }
        // --------------------------------------------------
        // AWS SDK v3: convert stream -> Buffer
        // --------------------------------------------------
        const stream = response.Body;
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        // --------------------------------------------------
        // Headers
        // --------------------------------------------------
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${s3Key.split("/").pop() ?? "timesheet.pdf"}"`);
        return res.send(buffer);
    }
    catch (err) {
        console.error("Timesheet download error:", err);
        return res.status(500).json({
            message: "Failed to download PDF",
            error: err.message,
        });
    }
});
exports.default = router;
