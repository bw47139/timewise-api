// src/modules/employee/employee.emergency.routes.ts

import { Router, Request, Response } from "express";
import { prisma } from "../../prisma";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

/**
 * ------------------------------------------------------
 * GET ALL EMERGENCY CONTACTS FOR EMPLOYEE
 * GET /api/employee/:id/emergency
 * ------------------------------------------------------
 */
router.get("/:id/emergency", verifyToken, async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const orgId = (req as any).user?.organizationId;

    if (!employeeId) return res.status(400).json({ error: "Invalid employee ID" });

    // Validate employee belongs to organization
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId, isDeleted: false },
    });

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const contacts = await prisma.emergencyContact.findMany({
      where: { employeeId },
      orderBy: { id: "asc" },
    });

    return res.json(contacts);
  } catch (error) {
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
router.post("/:id/emergency", verifyToken, async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const orgId = (req as any).user?.organizationId;
    const { name, phone, relation } = req.body;

    if (!name || !phone || !relation) {
      return res.status(400).json({ error: "Name, phone, and relation are required" });
    }

    // Validate employee
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId, isDeleted: false },
    });

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const newContact = await prisma.emergencyContact.create({
      data: {
        employeeId,
        name,
        phone,
        relation,
      },
    });

    return res.status(201).json(newContact);
  } catch (error) {
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
router.delete(
  "/:id/emergency/:contactId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const employeeId = Number(req.params.id);
      const contactId = Number(req.params.contactId);
      const orgId = (req as any).user?.organizationId;

      if (!employeeId || !contactId)
        return res.status(400).json({ error: "Invalid ID" });

      const contact = await prisma.emergencyContact.findFirst({
        where: {
          id: contactId,
          employeeId,
          employee: { organizationId: orgId },
        },
      });

      if (!contact) return res.status(404).json({ error: "Contact not found" });

      await prisma.emergencyContact.delete({ where: { id: contactId } });

      return res.json({ success: true });
    } catch (error) {
      console.error("❌ Emergency Contact DELETE error:", error);
      return res.status(500).json({ error: "Failed to delete contact" });
    }
  }
);

export default router;
