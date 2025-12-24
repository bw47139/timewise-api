// src/modules/punch/punch.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { verifyToken } from "../../middleware/verifyToken";
import { createAuditLog } from "../audit/audit.service";
import { AuditActions } from "../audit/audit.actions";

const prisma = new PrismaClient();
const router = Router();

/**
 * -------------------------------------------------------
 * POST /api/punches/add
 * Add a new IN or OUT punch
 * -------------------------------------------------------
 * Required body:
 * {
 *   "employeeId": 5,
 *   "locationId": 1,
 *   "type": "IN" | "OUT",
 *   "timestamp": "2025-01-01T09:00:00"
 * }
 */
router.post("/add", verifyToken, async (req: Request, res: Response) => {
  try {
    const { employeeId, locationId, type, timestamp } = req.body;

    if (!employeeId || !locationId || !type || !timestamp) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (type !== "IN" && type !== "OUT") {
      return res.status(400).json({ error: "type must be 'IN' or 'OUT'" });
    }

    const punch = await prisma.punch.create({
      data: {
        employeeId: Number(employeeId),
        locationId: Number(locationId),
        type,
        timestamp: new Date(timestamp),
      },
    });

    /**
     * ✅ Typed audit log (SAFE)
     */
    await createAuditLog({
      action: AuditActions.CREATE_PUNCH,
      entityType: "Punch",
      entityId: punch.id,

      userId: (req as any).user?.id ?? null,
      userEmail: (req as any).user?.email ?? null,

      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,

      metadata: {
        punch,
      },
    });

    return res.json({ success: true, punch });
  } catch (error) {
    console.error("ADD PUNCH ERROR:", error);
    return res.status(500).json({ error: "Failed to add punch" });
  }
});

/**
 * -------------------------------------------------------
 * DELETE /api/punches/:id
 * Delete a punch entry
 * -------------------------------------------------------
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.punch.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Punch not found" });
    }

    await prisma.punch.delete({ where: { id } });

    /**
     * ✅ Typed audit log (SAFE)
     */
    await createAuditLog({
      action: AuditActions.DELETE_PUNCH,
      entityType: "Punch",
      entityId: id,

      userId: (req as any).user?.id ?? null,
      userEmail: (req as any).user?.email ?? null,

      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,

      metadata: {
        beforeData: existing,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE PUNCH ERROR:", error);
    return res.status(500).json({ error: "Failed to delete punch" });
  }
});

export default router;
