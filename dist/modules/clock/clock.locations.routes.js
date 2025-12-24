"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * GET /api/clock/locations
 * Public endpoint for clock kiosks
 * ------------------------------------------------------
 */
router.get("/locations", async (_req, res) => {
    try {
        const locations = await prisma.location.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        });
        res.json(locations);
    }
    catch (err) {
        console.error("Clock locations error:", err);
        res.status(500).json({ error: "Failed to load locations" });
    }
});
exports.default = router;
