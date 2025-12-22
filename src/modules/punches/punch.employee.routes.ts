import { Router } from "express";
import { prisma } from "../../prisma";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

/**
 * ======================================================
 * GET /api/punches/employee/:employeeId
 * Returns punch history for a single employee
 * ======================================================
 */
router.get("/:employeeId", verifyToken, async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    if (!employeeId) {
      return res.status(400).json({ error: "Invalid employeeId" });
    }

    const orgId = (req as any).user?.organizationId;

    const punches = await prisma.punch.findMany({
      where: {
        employeeId,
        employee: {
          organizationId: orgId,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    res.json(punches);
  } catch (err) {
    console.error("❌ Punch history error:", err);
    res.status(500).json({ error: "Failed to load punch history" });
  }
});

export default router;
