"use strict";
// src/modules/employee/employee.emergency.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../prisma");
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
/**
 * ------------------------------------------------------
 * GET ALL EMERGENCY CONTACTS FOR EMPLOYEE
 * GET /api/employee/:id/emergency
 * ------------------------------------------------------
 */
router.get("/:id/emergency", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        const orgId = req.user?.organizationId;
        if (!employeeId)
            return res.status(400).json({ error: "Invalid employee ID" });
        // Validate employee belongs to organization
        const employee = await prisma_1.prisma.employee.findFirst({
            where: { id: employeeId, organizationId: orgId, isDeleted: false },
        });
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });
        const contacts = await prisma_1.prisma.emergencyContact.findMany({
            where: { employeeId },
            orderBy: { id: "asc" },
        });
        return res.json(contacts);
    }
    catch (error) {
        console.error("❌ Emergency Contact GET error:", error);
        return res.status(500).json({ error: "Failed to load emergency contacts" });
    }
});
/**
 * ------------------------------------------------------
 * ADD EMERGENCY CONTACT
 * POST /api/employee/:id/emergency
 * ------------------------------------------------------
 */
router.post("/:id/emergency", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        const orgId = req.user?.organizationId;
        const { name, phone, relation } = req.body;
        if (!name || !phone || !relation) {
            return res.status(400).json({ error: "Name, phone, and relation are required" });
        }
        // Validate employee
        const employee = await prisma_1.prisma.employee.findFirst({
            where: { id: employeeId, organizationId: orgId, isDeleted: false },
        });
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });
        const newContact = await prisma_1.prisma.emergencyContact.create({
            data: {
                employeeId,
                name,
                phone,
                relation,
            },
        });
        return res.status(201).json(newContact);
    }
    catch (error) {
        console.error("❌ Emergency Contact POST error:", error);
        return res.status(500).json({ error: "Failed to create emergency contact" });
    }
});
/**
 * ------------------------------------------------------
 * DELETE EMERGENCY CONTACT
 * DELETE /api/employee/:id/emergency/:contactId
 * ------------------------------------------------------
 */
router.delete("/:id/emergency/:contactId", verifyToken_1.verifyToken, async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        const contactId = Number(req.params.contactId);
        const orgId = req.user?.organizationId;
        if (!employeeId || !contactId)
            return res.status(400).json({ error: "Invalid ID" });
        const contact = await prisma_1.prisma.emergencyContact.findFirst({
            where: {
                id: contactId,
                employeeId,
                employee: { organizationId: orgId },
            },
        });
        if (!contact)
            return res.status(404).json({ error: "Contact not found" });
        await prisma_1.prisma.emergencyContact.delete({ where: { id: contactId } });
        return res.json({ success: true });
    }
    catch (error) {
        console.error("❌ Emergency Contact DELETE error:", error);
        return res.status(500).json({ error: "Failed to delete contact" });
    }
});
exports.default = router;
