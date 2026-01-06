import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();
const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * GET /api/organization
 * ------------------------------------------------------
 * Admin-only: List all organizations
 * ------------------------------------------------------
 */
router.get("/", verifyToken, async (_req: Request, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { id: "asc" },
    });

    return res.json(organizations);
  } catch (error) {
    console.error("❌ Failed to load organizations:", error);
    return res.status(500).json({ error: "Failed to load organizations" });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/organization/me
 * ------------------------------------------------------
 * Return organization of logged-in user
 * (CRITICAL: must come before /:id)
 * ------------------------------------------------------
 */
router.get("/me", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;

    if (!organizationId || isNaN(Number(organizationId))) {
      return res.status(400).json({ error: "Invalid organization id" });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: Number(organizationId) },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(organization);
  } catch (error) {
    console.error("❌ Failed to load current organization:", error);
    return res.status(500).json({ error: "Failed to load organization" });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/organization/:id
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid organization id" });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(organization);
  } catch (error) {
    console.error("❌ Failed to load organization:", error);
    return res.status(500).json({ error: "Failed to load organization" });
  }
});

export default router;
