// src/modules/employee/employee.status.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * PATCH /api/employees/:id/status
 * Toggle employee active/inactive
 */
router.patch("/:id/status", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { status },
    });

    res.json(employee);
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ error: "Failed to update employee status" });
  }
});

export default router;
