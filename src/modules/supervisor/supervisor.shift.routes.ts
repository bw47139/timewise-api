import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { createAuditLog } from "../audit/audit.service";

const router = Router();
const prisma = new PrismaClient();

/**
 * Supervisor Edit Punch
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const punchId = Number(req.params.id);
    const {
      timestamp,
      supervisorId,
      reason
    } = req.body;

    if (!punchId || !timestamp) {
      return res.status(400).json({
        error: "Punch ID and timestamp are required"
      });
    }

    if (!supervisorId) {
      return res.status(400).json({
        error: "supervisorId is required"
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: "reason is required for supervisor override"
      });
    }

    const punch = await prisma.punch.findUnique({
      where: { id: punchId }
    });

    if (!punch) {
      return res.status(404).json({ error: "Punch not found" });
    }

    const updated = await prisma.punch.update({
      where: { id: punchId },
      data: {
        timestamp: new Date(timestamp),
        isSupervisorOverride: true,
        overrideByUserId: supervisorId,
        overrideReason: reason
      }
    });

    // ✅ AUDIT LOG (userId, NOT supervisorId)
    await createAuditLog({
      action: "EDIT_PUNCH",
      entityId: updated.id,
      userId: supervisorId,
      beforeData: punch,
      afterData: updated,
      metadata: {
        reason
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Supervisor edit punch error:", error);
    res.status(500).json({
      error: "Failed to edit punch"
    });
  }
});

export default router;
