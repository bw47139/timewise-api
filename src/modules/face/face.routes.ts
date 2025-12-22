import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { verifyToken } from "../../middleware/verifyToken";

import {
  rekognitionClient,
  COLLECTION_ID,
} from "../../utils/rekognition";

import { IndexFacesCommand } from "@aws-sdk/client-rekognition";

const prisma = new PrismaClient();
const router = Router();

/**
 * Multer setup (memory storage)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * ------------------------------------------------------
 * POST /api/face/enroll/:employeeId
 * Admin enrolls employee face using PHOTO
 * ------------------------------------------------------
 */
router.post(
  "/enroll/:employeeId",
  verifyToken,
  upload.single("photo"),
  async (req: Request, res: Response) => {
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
      const command = new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: {
          Bytes: req.file.buffer,
        },
        ExternalImageId: `employee-${employeeId}`,
        DetectionAttributes: [],
      });

      const result = await rekognitionClient.send(command);

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
    } catch (error) {
      console.error("❌ Face enrollment failed:", error);
      return res.status(500).json({
        error: "Face enrollment failed",
      });
    }
  }
);

export default router;
