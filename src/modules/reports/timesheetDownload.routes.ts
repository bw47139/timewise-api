// src/modules/reports/timesheetDownload.routes.ts

import { Router, Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { s3Client } from "../../utils/s3Client";

const router = Router();

/**
 * ----------------------------------------------------------
 * GET /api/reports/timesheet-download?s3Key=...
 *
 * Downloads a timesheet PDF from S3
 * ----------------------------------------------------------
 */
router.get("/timesheet-download", async (req: Request, res: Response) => {
  try {
    const s3Key = req.query.s3Key as string;

    if (!s3Key) {
      return res.status(400).json({
        message: "Missing s3Key parameter",
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return res.status(404).json({
        message: "File not found in S3",
      });
    }

    // --------------------------------------------------
    // AWS SDK v3: convert stream -> Buffer
    // --------------------------------------------------
    const stream = response.Body as AsyncIterable<Uint8Array>;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);

    // --------------------------------------------------
    // Headers
    // --------------------------------------------------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${s3Key.split("/").pop() ?? "timesheet.pdf"}"`
    );

    return res.send(buffer);
  } catch (err: any) {
    console.error("Timesheet download error:", err);
    return res.status(500).json({
      message: "Failed to download PDF",
      error: err.message,
    });
  }
});

export default router;
