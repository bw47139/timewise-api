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
 * (Useful for system testing & super-admin tools)
 * ------------------------------------------------------
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
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
 * GET /api/organization/current
 * ------------------------------------------------------
 * Returns the organization of the logged-in user
 * (Most commonly used by frontend dashboard)
 * ------------------------------------------------------
 */
router.get("/current", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
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
 * Load organization by ID
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

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
