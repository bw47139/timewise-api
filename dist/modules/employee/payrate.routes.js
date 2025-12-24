"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/employee/payrate.routes.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const verifyToken_1 = require("../../middleware/verifyToken");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * GET /api/employee/:id/payrates
 * Returns all pay rates for the employee
 */
router.get("/:id/payrates", verifyToken_1.verifyToken, async (req, res) => {
    const employeeId = Number(req.params.id);
    try {
        const rates = await prisma.payRate.findMany({
            where: { employeeId },
            orderBy: { effectiveDate: "desc" },
        });
        return res.json(rates);
    }
    catch (err) {
        console.error("Get PayRate Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * POST /api/employee/:id/payrates
 */
router.post("/:id/payrates", verifyToken_1.verifyToken, async (req, res) => {
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
    }
    catch (err) {
        console.error("Create PayRate Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * PUT /api/employee/payrates/:rateId
 */
router.put("/payrates/:rateId", verifyToken_1.verifyToken, async (req, res) => {
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
    }
    catch (err) {
        console.error("Update PayRate Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * DELETE /api/employee/payrates/:rateId
 */
router.delete("/payrates/:rateId", verifyToken_1.verifyToken, async (req, res) => {
    const rateId = Number(req.params.rateId);
    try {
        await prisma.payRate.delete({
            where: { id: rateId },
        });
        return res.json({ message: "Pay rate deleted" });
    }
    catch (err) {
        console.error("Delete PayRate Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
