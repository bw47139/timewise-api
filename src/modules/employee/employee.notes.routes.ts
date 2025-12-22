// src/modules/employee/employee.notes.routes.ts
import { Router, Request, Response } from "express";

import { prisma } from "../../prisma";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

/**
 * GET /api/employees/:id/notes
 * List notes for an employee (newest first)
 */
router.get("/:id/notes", verifyToken, async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const employeeId = Number(req.params.id);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    // Ensure employee belongs to this org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const notes = await prisma.employeeNote.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(notes);
  } catch (err) {
    console.error("GET /employees/:id/notes error:", err);
    return res.status(500).json({ error: "Failed to load notes" });
  }
});

/**
 * POST /api/employees/:id/notes
 * Body: { note: string }
 */
router.post("/:id/notes", verifyToken, async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const employeeId = Number(req.params.id);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const { note } = req.body as { note?: string };

    if (!note || !note.trim()) {
      return res.status(400).json({ error: "note is required" });
    }

    // Ensure employee belongs to this org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const created = await prisma.employeeNote.create({
      data: {
        employeeId,
        note: note.trim(),
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("POST /employees/:id/notes error:", err);
    return res.status(500).json({ error: "Failed to create note" });
  }
});

/**
 * DELETE /api/employees/:id/notes/:noteId
 */
router.delete(
  "/:id/notes/:noteId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId;
      if (!orgId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const employeeId = Number(req.params.id);
      const noteId = Number(req.params.noteId);

      if (Number.isNaN(employeeId) || Number.isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid id(s)" });
      }

      // Ensure note belongs to this employee + org
      const note = await prisma.employeeNote.findFirst({
        where: {
          id: noteId,
          employeeId,
          employee: {
            organizationId: orgId,
          },
        },
      });

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      await prisma.employeeNote.delete({
        where: { id: note.id },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("DELETE /employees/:id/notes/:noteId error:", err);
      return res.status(500).json({ error: "Failed to delete note" });
    }
  }
);

export default router;
