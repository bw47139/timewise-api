// src/modules/employee/payrate.routes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/employee/:id/payrates
 * Returns all pay rates for the employee
 */
router.get("/:id/payrates", verifyToken, async (req: Request, res: Response) => {
  const employeeId = Number(req.params.id);

  try {
    const rates = await prisma.payRate.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: "desc" },
    });

    return res.json(rates);
  } catch (err) {
    console.error("Get PayRate Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/employee/:id/payrates
 */
router.post("/:id/payrates", verifyToken, async (req: Request, res: Response) => {
  const employeeId = Number(req.params.id);
  const { rate, effectiveDate } = req.body;

  if (!rate || !effectiveDate) {
    return res.status(400).json({ error: "rate and effectiveDate required" });
  }

  try {
    const newRate = await prisma.payRate.create({
      data: {
        employeeId,
        rate,
        effectiveDate: new Date(effectiveDate),
      },
    });

    return res.json(newRate);
  } catch (err) {
    console.error("Create PayRate Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/employee/payrates/:rateId
 */
router.put("/payrates/:rateId", verifyToken, async (req: Request, res: Response) => {
  const rateId = Number(req.params.rateId);
  const { rate, effectiveDate } = req.body;

  try {
    const updated = await prisma.payRate.update({
      where: { id: rateId },
      data: {
        rate,
        effectiveDate: new Date(effectiveDate),
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Update PayRate Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/employee/payrates/:rateId
 */
router.delete("/payrates/:rateId", verifyToken, async (req: Request, res: Response) => {
  const rateId = Number(req.params.rateId);

  try {
    await prisma.payRate.delete({
      where: { id: rateId },
    });

    return res.json({ message: "Pay rate deleted" });
  } catch (err) {
    console.error("Delete PayRate Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
