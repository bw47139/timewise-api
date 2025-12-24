import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { createAuditLog } from "../audit/audit.service";

const router = Router();
const prisma = new PrismaClient();

/**
 * Supervisor Edit Punch
 */
router.put("/punch/:id", async (req: Request, res: Response) => {
  try {
    const punchId = Number(req.params.id);
    const { timestamp, type, locationId, supervisorId, reason } = req.body;

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

    // SAVE OLD DATA FOR AUDIT LOG
    const beforeData = { ...punch };

    const updatedPunch = await prisma.punch.update({
      where: { id: punchId },
      data: {
        timestamp: timestamp ? new Date(timestamp) : punch.timestamp,
        type: type ?? punch.type,
        locationId: locationId ?? punch.locationId,
        isSupervisorOverride: true,
        overrideByUserId: supervisorId ?? null,
        overrideReason: reason
      }
    });

    // SAVE NEW DATA FOR AUDIT LOG
    const afterData = { ...updatedPunch };

    await createAuditLog({
      action: "EDIT_PUNCH",
      entityId: punchId,
      beforeData,
      afterData,
      userId: supervisorId ?? null, // ✅ FIXED
      reason
    });

    res.json({
      message: "Punch updated successfully",
      punch: updatedPunch
    });

  } catch (error) {
    console.error("Supervisor punch edit error:", error);
    res.status(500).json({ error: "Failed to edit punch" });
  }
});

export default router;
