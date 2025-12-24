"use strict";
// src/modules/employee/documentTypes.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../prisma");
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
/**
 * GET /api/document-types
 * List all document types
 */
router.get("/", verifyToken_1.verifyToken, async (_req, res) => {
    try {
        const types = await prisma_1.prisma.documentType.findMany({
            orderBy: { name: "asc" },
        });
        return res.json(types);
    }
    catch (err) {
        console.error("GET /document-types error:", err);
        return res.status(500).json({ error: "Failed to load document types" });
    }
});
/**
 * POST /api/document-types
 */
router.post("/", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const { name, description, requiredForEmployees } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }
        const created = await prisma_1.prisma.documentType.create({
            data: {
                name,
                description: description || null,
                requiredForEmployees: requiredForEmployees || false,
            },
        });
        return res.status(201).json(created);
    }
    catch (err) {
        console.error("POST /document-types error:", err);
        return res.status(500).json({ error: "Failed to create document type" });
    }
});
/**
 * DELETE /api/document-types/:id
 */
router.delete("/:id", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id))
            return res.status(400).json({ error: "Invalid id" });
        await prisma_1.prisma.documentType.delete({ where: { id } });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("DELETE /document-types error:", err);
        return res.status(500).json({ error: "Failed to delete document type" });
    }
});
exports.default = router;
