import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { createAuditLog } from "../audit/audit.service";

const router = Router();
const prisma = new PrismaClient();

/**
 * Supervisor Delete Punch
 */
router.delete("/punch/:id", async (req: Request, res: Response) => {
  try {
    const punchId = Number(req.params.id);
    const { supervisorId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "reason is required" });
    }

    const punch = await prisma.punch.findUnique({
      where: { id: punchId }
    });

    if (!punch) {
      return res.status(404).json({ error: "Punch not found" });
    }

    // Save before-data for audit
    const beforeData = { ...punch };

    await prisma.punch.delete({
      where: { id: punchId }
    });

    await createAuditLog({
      action: "DELETE_PUNCH",
      entityId:punchId,
      beforeData,
      userId: supervisorId ?? null, // ✅ FIXED
      reason
    });

    res.json({
      message: "Punch deleted successfully",
      punchId
    });

  } catch (error) {
    console.error("Delete punch error:", error);
    res.status(500).json({ error: "Failed to delete punch" });
  }
});

export default router;
