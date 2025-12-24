"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/reports/documentExpiration.routes.ts
const express_1 = require("express");
const prisma_1 = require("../../prisma");
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
/**
 * GET /api/reports/documents/expiring-soon?days=60
 *
 * Returns documents with an expiration date within the next N days
 * (and already expired ones if they exist).
 *
 * Includes basic employee + category info so the dashboard widget
 * and the reminder UI can show who needs attention.
 */
router.get("/expiring-soon", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user?.organizationId;
        if (!orgId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const days = Number(req.query.days) || 60;
        const now = new Date();
        const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const docs = await prisma_1.prisma.employeeDocument.findMany({
            where: {
                employee: {
                    organizationId: orgId,
                },
                expiresAt: {
                    not: null,
                    lte: horizon,
                },
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                category: true,
            },
            orderBy: {
                expiresAt: "asc",
            },
        });
        return res.json({ docs, now });
    }
    catch (err) {
        console.error("GET /reports/documents/expiring-soon error:", err);
        return res
            .status(500)
            .json({ error: "Failed to load expiring documents" });
    }
});
exports.default = router;
