// src/modules/payrate/payrate.routes.ts

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/payrate
 * List all pay rates (admin/debug use)
 */
router.get("/", verifyToken, async (_req, res) => {
  const rates = await prisma.payRate.findMany({
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { employeeId: "asc" },
      { effectiveDate: "desc" },
    ],
  });

  res.json(rates);
});

/**
 * POST /api/payrate
 * Create new pay rate
 */
router.post("/", verifyToken, async (req, res) => {
  const { employeeId, rate, effectiveDate } = req.body;

  if (!employeeId || !rate || !effectiveDate) {
    return res.status(400).json({
      error: "employeeId, rate, effectiveDate required",
    });
  }

  const created = await prisma.payRate.create({
    data: {
      employeeId,
      rate,
      effectiveDate: new Date(effectiveDate),
    },
  });

  res.json(created);
});

export default router;
