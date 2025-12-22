// src/modules/employee/employee.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * -----------------------------------------
 * LIST EMPLOYEES
 * GET /api/employees
 * -----------------------------------------
 */
export async function listEmployeesHandler(req: Request, res: Response) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        location: true,
        payRates: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(employees);
  } catch (err) {
    console.error("List employees error:", err);
    res.status(500).json({ error: "Failed to list employees" });
  }
}

/**
 * -----------------------------------------
 * CREATE EMPLOYEE
 * POST /api/employees
 * -----------------------------------------
 */
export async function createEmployeeHandler(req: Request, res: Response) {
  try {
    const { firstName, lastName, pin, locationId } = req.body;

    if (!firstName || !lastName || !pin || !locationId) {
      return res
        .status(400)
        .json({ error: "firstName, lastName, pin, and locationId are required" });
    }

    // Get organizationId automatically from logged-in user (via verifyToken)
    const organizationId = (req as any).user.organizationId;

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        pin,
        locationId: Number(locationId),
        organizationId,
      },
    });

    res.json(employee);
  } catch (err: any) {
    console.error("Create employee error:", err);

    if (err.code === "P2002") {
      return res.status(400).json({ error: "PIN must be unique" });
    }

    res.status(500).json({ error: "Failed to create employee" });
  }
}

/**
 * -----------------------------------------
 * GET EMPLOYEE BY ID
 * GET /api/employees/:id
 * -----------------------------------------
 */
export async function getEmployeeHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        location: true,
        payRates: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Prevent accessing employees of another organization
    const organizationId = (req as any).user.organizationId;
    if (employee.organizationId !== organizationId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(employee);
  } catch (err) {
    console.error("Get employee error:", err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
}

/**
 * -----------------------------------------
 * UPDATE EMPLOYEE
 * PUT /api/employees/:id
 * -----------------------------------------
 */
export async function updateEmployeeHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { firstName, lastName, email, pin, locationId } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Security: Only update employee belonging to same organization
    const organizationId = (req as any).user.organizationId;
    if (existing.organizationId !== organizationId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        pin,
        locationId: Number(locationId),
      },
    });

    res.json(employee);
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
}

/**
 * -----------------------------------------
 * DELETE EMPLOYEE
 * DELETE /api/employees/:id
 * -----------------------------------------
 */
export async function deleteEmployeeHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.employee.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const organizationId = (req as any).user.organizationId;
    if (existing.organizationId !== organizationId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.employee.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
}
