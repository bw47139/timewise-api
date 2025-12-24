import { Router, Request, Response } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { verifyToken } from "../../middleware/verifyToken";
import { s3Client } from "../../utils/s3Client";

const prisma = new PrismaClient();
const router = Router();

/**
 * ------------------------------------------------------
 * Multer config (memory storage)
 * ------------------------------------------------------
 */
const upload = multer({
  storage: multer.memoryStorage(),
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
router.post(
  "/:id/photo",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
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
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: oldKey,
            })
          );
        }
      }

      // --------------------------------------------------
      // Build S3 key
      // --------------------------------------------------
      const extension =
        req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";

      const key = `employees/${employee.organizationId}/${employeeId}/photo.${extension}`;

      // --------------------------------------------------
      // Upload to S3 (PUBLIC)
      // --------------------------------------------------
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
      );

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
    } catch (error) {
      console.error("EMPLOYEE PHOTO UPLOAD ERROR:", error);
      return res
        .status(500)
        .json({ error: "Failed to upload employee photo" });
    }
  }
);

/**
 * ------------------------------------------------------
 * DELETE /api/employee/:id/photo
 * Remove employee photo (S3 + DB)
 * ------------------------------------------------------
 */
router.delete("/:id/photo", verifyToken, async (req, res) => {
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
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: { photoUrl: null },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("EMPLOYEE PHOTO DELETE ERROR:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete employee photo" });
  }
});

export default router;
