// src/modules/employee/employee.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient, EmployeeStatus } from "@prisma/client";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();
const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * GET /api/employee
 * ------------------------------------------------------
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;

    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      orderBy: { id: "asc" },
      include: {
        emergencyContacts: true,
        payRates: true,
      },
    });

    return res.json(employees);
  } catch (error) {
    console.error("❌ Failed to load employees:", error);
    return res.status(500).json({ error: "Failed to load employees" });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/employee/:id
 * ------------------------------------------------------
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { organizationId } = req.user as any;

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        organizationId,
        isDeleted: false,
      },
      include: {
        emergencyContacts: true,
        payRates: true,
        notes: true,
        documents: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json(employee);
  } catch (error) {
    console.error("❌ Failed to load employee:", error);
    return res.status(500).json({ error: "Failed to load employee" });
  }
});

/**
 * ------------------------------------------------------
 * POST /api/employee
 * Create new employee
 * ------------------------------------------------------
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;

    const {
      firstName,
      middleName,
      lastName,
      preferredName,
      email,
      pin,
      phoneNumber,
      phoneAlt,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      jobTitle,
      department,
      hireDate,
      dateOfBirth,
      gender,
      ssnLast4,
      maritalStatus,
      locationId,
    } = req.body;

    if (!firstName || !lastName || !pin) {
      return res.status(400).json({
        error: "firstName, lastName, and pin are required",
      });
    }

    const employee = await prisma.employee.create({
      data: {
        organizationId,
        locationId: Number(locationId) || 1,

        // Basic
        firstName,
        middleName: middleName || null,
        lastName,
        preferredName: preferredName || null,
        email: email || null,
        pin,

        // Contact
        phoneNumber: phoneNumber || null,
        phoneAlt: phoneAlt || null,

        // Address
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || "USA",

        // Employment
        jobTitle: jobTitle || null,
        department: department || null,
        hireDate: hireDate ? new Date(hireDate) : new Date(),

        // Personal
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        ssnLast4: ssnLast4 || null,
        maritalStatus: maritalStatus || null,

        status: EmployeeStatus.ACTIVE,
        isDeleted: false,
      },
    });

    return res.status(201).json(employee);
  } catch (error: any) {
    console.error("❌ Failed to create employee:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Employee with this PIN already exists",
      });
    }

    return res.status(500).json({ error: "Failed to create employee" });
  }
});

/**
 * ------------------------------------------------------
 * PATCH /api/employee/:id
 * Update Employee Profile (Overview tab)
 * ------------------------------------------------------
 */
router.patch("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { organizationId } = req.user as any;

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const fieldsToUpdate = [
      "firstName",
      "middleName",
      "lastName",
      "preferredName",
      "email",
      "pin",
      "phoneNumber",
      "phoneAlt",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "postalCode",
      "country",
      "jobTitle",
      "department",
      "gender",
      "ssnLast4",
      "maritalStatus",
      "locationId",
      "status",
    ];

    const updateData: any = {};

    for (const field of fieldsToUpdate) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field] || null;
      }
    }

    // Date fields
    if (req.body.hireDate !== undefined) {
      updateData.hireDate = req.body.hireDate
        ? new Date(req.body.hireDate)
        : null;
    }

    if (req.body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = req.body.dateOfBirth
        ? new Date(req.body.dateOfBirth)
        : null;
    }

    const updated = await prisma.employee.update({
      where: { id, organizationId },
      data: updateData,
    });

    return res.json({ success: true, employee: updated });
  } catch (error) {
    console.error("❌ Failed to update employee:", error);
    return res.status(500).json({ error: "Failed to update employee" });
  }
});

export default router;
