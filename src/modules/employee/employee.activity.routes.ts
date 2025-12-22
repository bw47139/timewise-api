import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { verifyToken } from "../../middleware/verifyToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET ACTIVITY LOG FOR EMPLOYEE
 * GET /api/employees/:id/activity
 */
router.get("/:id/activity", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.employeeActivity.findMany({
        where: { employeeId: id },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: true,
        },
      }),
      prisma.employeeActivity.count({ where: { employeeId: id } }),
    ]);

    return res.json({
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch activity log" });
  }
});

export default router;
