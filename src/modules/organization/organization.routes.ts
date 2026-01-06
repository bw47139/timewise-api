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
 * GET /api/organization/me
 * ------------------------------------------------------
 * Returns the organization of the logged-in user
 * (Frontend expects /me)
 * ------------------------------------------------------
 */
router.get("/me", verifyToken, async (req: Request, res: Response) => {
  try {
    const organizationId = Number((req as any).user?.organizationId);

    if (!organizationId || Number.isNaN(organizationId)) {
      return res.status(401).json({ error: "Unauthorized (missing organization)" });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(organization);
  } catch (error) {
    console.error("❌ Failed to load /organization/me:", error);
    return res.status(500).json({ error: "Failed to load organization" });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/organization/current
 * ------------------------------------------------------
 * Backwards-compatible alias (optional)
 * ------------------------------------------------------
 */
router.get("/current", verifyToken, async (req: Request, res: Response) => {
  try {
    const organizationId = Number((req as any).user?.organizationId);

    if (!organizationId || Number.isNaN(organizationId)) {
      return res.status(401).json({ error: "Unauthorized (missing organization)" });
    }

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

    // ✅ IMPORTANT: prevent /me or invalid strings from crashing Prisma
    if (Number.isNaN(id)) {
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
