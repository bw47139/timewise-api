import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { IndexFacesCommand } from "@aws-sdk/client-rekognition";

import { rekognitionClient, COLLECTION_ID } from "../../utils/rekognitionClient";

const prisma = new PrismaClient();
const router = Router();

/**
 * Reindex ALL employees
 */
router.post("/reindex-all", async (req, res) => {
  console.log("🔄 Starting face reindex...");

  if (!COLLECTION_ID) {
    return res.status(500).json({
      error: "AWS_REKOGNITION_COLLECTION_ID is missing. Cannot index faces.",
    });
  }

  try {
    const employees = await prisma.employee.findMany();
    const results: any[] = [];

    for (const emp of employees) {
      if (!emp.photoUrl) continue;

      const url = new URL(emp.photoUrl);
      const bucket = url.hostname.split(".")[0];
      const key = url.pathname.substring(1);

      const cmd = new IndexFacesCommand({
        CollectionId: COLLECTION_ID, // ✅ FIXED
        Image: { S3Object: { Bucket: bucket, Name: key } },
        ExternalImageId: String(emp.id),
      });

      try {
        const result = await rekognitionClient.send(cmd);
        console.log(`Indexed face for employee ${emp.id}`);

        results.push({ id: emp.id, result });
      } catch (err) {
        console.error(`❌ Error indexing employee ${emp.id}`, err);
      }
    }

    res.json({
      message: "Reindex complete",
      count: results.length,
      results,
    });
  } catch (err: any) {
    console.error("❌ Batch reindex failed:", err);
    res.status(500).json({ error: "Batch reindex failed", details: err });
  }
});

export default router;
