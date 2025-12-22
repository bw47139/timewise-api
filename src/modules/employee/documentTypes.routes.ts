// src/modules/employee/documentTypes.routes.ts

import { Router, Request, Response } from "express";

import { prisma } from "../../prisma";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

/**
 * GET /api/document-types
 * List all document types
 */
router.get("/", verifyToken, async (_req: Request, res: Response) => {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { name: "asc" },
    });
    return res.json(types);
  } catch (err) {
    console.error("GET /document-types error:", err);
    return res.status(500).json({ error: "Failed to load document types" });
  }
});

/**
 * POST /api/document-types
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { name, description, requiredForEmployees } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const created = await prisma.documentType.create({
      data: {
        name,
        description: description || null,
        requiredForEmployees: requiredForEmployees || false,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("POST /document-types error:", err);
    return res.status(500).json({ error: "Failed to create document type" });
  }
});

/**
 * DELETE /api/document-types/:id
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    await prisma.documentType.delete({ where: { id } });

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /document-types error:", err);
    return res.status(500).json({ error: "Failed to delete document type" });
  }
});

export default router;
