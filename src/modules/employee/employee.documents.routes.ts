// src/modules/employee/employee.documents.routes.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { prisma } from "../../prisma";
import { verifyToken } from "../../middleware/verifyToken";
import { s3Client } from "../../utils/s3Client";

const router = Router();

// Memory upload → S3
const upload = multer({ storage: multer.memoryStorage() });

const BUCKET = process.env.AWS_S3_BUCKET;

// ------------------------------
// Helper: Org
// ------------------------------
function getOrgId(req: Request): number | null {
  const user = (req as any).user;
  if (!user || !user.organizationId) return null;
  return Number(user.organizationId);
}

// ------------------------------
// Helper: Ensure employee belongs to org
// ------------------------------
async function getEmployee(employeeId: number, orgId: number) {
  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      organizationId: orgId,
    },
  });
}

// ------------------------------------------------------
// GET /api/employees/:id/documents
// ------------------------------------------------------
router.get(
  "/:id/documents",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

      const employeeId = Number(req.params.id);
      if (Number.isNaN(employeeId))
        return res.status(400).json({ error: "Invalid employee id" });

      const employee = await getEmployee(employeeId, orgId);
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });

      const docs = await prisma.employeeDocument.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
      });

      return res.json(docs);
    } catch (err) {
      console.error("GET documents error:", err);
      return res.status(500).json({ error: "Failed to load documents" });
    }
  }
);

// ------------------------------------------------------
// POST /api/employees/:id/documents
// Upload to S3 + DB record
// ------------------------------------------------------
router.post(
  "/:id/documents",
  verifyToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

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

      const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: fileType,
        ACL: "public-read",
      });

      await s3Client.send(cmd);

      const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;

      const doc = await prisma.employeeDocument.create({
        data: {
          employeeId,
          fileName: originalName,
          fileType,
          fileUrl,
        },
      });

      return res.status(201).json(doc);
    } catch (err) {
      console.error("UPLOAD document error:", err);
      return res.status(500).json({ error: "Failed to upload document" });
    }
  }
);

// ------------------------------------------------------
// DELETE /api/employees/:id/documents/:docId
// Deletes S3 file + DB record
// ------------------------------------------------------
router.delete(
  "/:id/documents/:docId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });

      const employeeId = Number(req.params.id);
      const docId = Number(req.params.docId);
      if (Number.isNaN(employeeId) || Number.isNaN(docId))
        return res.status(400).json({ error: "Invalid id" });

      const doc = await prisma.employeeDocument.findFirst({
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
      } else {
        const key = split[1];
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
          })
        );
      }

      await prisma.employeeDocument.delete({
        where: { id: docId },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("DELETE document error:", err);
      return res.status(500).json({ error: "Failed to delete document" });
    }
  }
);

export default router;
