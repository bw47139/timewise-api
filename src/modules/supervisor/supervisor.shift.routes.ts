import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { createAuditLog } from "../audit/audit.service";

const router = Router();
const prisma = new PrismaClient();

/**
 * Supervisor Manual Full Shift Entry
 * Creates an IN and OUT punch pair.
 */
router.post("/shift", async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      locationId,
      startTime,
      endTime,
      supervisorId,
      reason
    } = req.body;

    if (!employeeId || !locationId || !startTime || !endTime)
      return res.status(400).json({
        error: "employeeId, locationId, startTime and endTime are required"
      });

    if (!reason)
      return res.status(400).json({
        error: "reason is required for supervisor override"
      });

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start)
      return res.status(400).json({ error: "endTime must be after startTime" });

    // CREATE IN PUNCH
    const punchIn = await prisma.punch.create({
      data: {
        employeeId,
        locationId,
        type: "IN",
        timestamp: start,
        isSupervisorOverride: true,
        overrideByUserId: supervisorId ?? null,
        overrideReason: reason
      }
    });

    // CREATE OUT PUNCH
    const punchOut = await prisma.punch.create({
      data: {
        employeeId,
        locationId,
        type: "OUT",
        timestamp: end,
        isSupervisorOverride: true,
        overrideByUserId: supervisorId ?? null,
        overrideReason: reason
      }
    });

    // AUDIT LOGS
    await createAuditLog({
      action: "CREATE_SHIFT_IN",
      tableName: "Punch",
      recordId: punchIn.id,
      afterData: punchIn,
      supervisorId,
      reason
    });

    await createAuditLog({
      action: "CREATE_SHIFT_OUT",
      tableName: "Punch",
      recordId: punchOut.id,
      afterData: punchOut,
      supervisorId,
      reason
    });

    res.json({
      message: "Shift created successfully",
      shift: {
        in: punchIn,
        out: punchOut
      }
    });

  } catch (error) {
    console.error("Supervisor shift creation error:", error);
    res.status(500).json({ error: "Failed to create manual shift" });
  }
});

export default router;
