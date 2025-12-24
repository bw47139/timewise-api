"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * ------------------------------------------------------
 * GET /api/organization
 * ------------------------------------------------------
 * Admin-only: List all organizations
 * (Useful for system testing & super-admin tools)
 * ------------------------------------------------------
 */
router.get("/", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const organizations = await prisma.organization.findMany({
            orderBy: { id: "asc" },
        });
        return res.json(organizations);
    }
    catch (error) {
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
router.get("/current", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const { organizationId } = req.user;
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }
        return res.json(organization);
    }
    catch (error) {
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
router.get("/:id", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const organization = await prisma.organization.findUnique({
            where: { id },
        });
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }
        return res.json(organization);
    }
    catch (error) {
        console.error("❌ Failed to load organization:", error);
        return res.status(500).json({ error: "Failed to load organization" });
    }
});
exports.default = router;
