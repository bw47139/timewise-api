import { Router, Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { s3Client } from "../../utils/s3Client";

const router = Router();

/**
 * Download a timesheet PDF from S3
 * Example:
 * GET /api/reports/timesheet-download?s3Key=timesheets/1/101/12345-timesheet.pdf
 */
router.get("/timesheet-download", async (req: Request, res: Response) => {
  try {
    const s3Key = req.query.s3Key as string;

    if (!s3Key) {
      return res.status(400).json({ message: "Missing s3Key parameter" });
    }

    const bucket = process.env.AWS_S3_BUCKET!;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const file = await s3Client.send(command);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${s3Key.split("/").pop()}"`
    );

    file.Body?.pipe(res);
  } catch (err: any) {
    console.error("Download error:", err);
    return res.status(500).json({
      message: "Failed to download PDF",
      error: err.message,
    });
  }
});

export default router;
