// src/modules/employee/employee.pdf.routes.ts

import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

import { createAuditLog } from "../audit/audit.service";
import { AuditActions } from "../audit/audit.actions";

const prisma = new PrismaClient();
const router = Router();

/**
 * ----------------------------------------------------------
 * GET /api/employee/:id/profile/pdf
 * ----------------------------------------------------------
 */
router.get("/pdf/:id", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);

    if (isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        payRates: true,
        emergencyContacts: true,
        notes: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=employee-${employee.id}.pdf`
    );

    doc.pipe(res);

    // ------------------------------------------
    // HEADER
    // ------------------------------------------
    doc
      .fontSize(20)
      .text(`${employee.firstName} ${employee.lastName}`, {
        underline: true,
      });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Employee ID: ${employee.id}`);
    doc.fontSize(12).text(`Email: ${employee.email ?? "—"}`);
    doc.fontSize(12).text(
      `Hire Date: ${
        employee.hireDate
          ? dayjs(employee.hireDate).format("MMM D, YYYY")
          : "—"
      }`
    );

    doc.moveDown(1);

    // ------------------------------------------
    // PAY RATES
    // ------------------------------------------
    doc.fontSize(16).text("Pay Rates", { underline: true });
    doc.moveDown(0.6);

    if (employee.payRates.length === 0) {
      doc.fontSize(12).text("No pay rates available.");
    } else {
      employee.payRates.forEach((rate) => {
        doc.fontSize(12).text(
          `• $${rate.rate.toFixed(2)} (effective ${dayjs(
            rate.effectiveDate
          ).format("MMM D, YYYY")})`
        );
      });
    }

    doc.moveDown(1);

    // ------------------------------------------
    // EMERGENCY CONTACTS
    // ------------------------------------------
    doc.fontSize(16).text("Emergency Contacts", { underline: true });
    doc.moveDown(0.6);

    if (employee.emergencyContacts.length === 0) {
      doc.fontSize(12).text("No contacts available.");
    } else {
      employee.emergencyContacts.forEach((c) => {
        doc.fontSize(12).text(
          `• ${c.name} — ${c.relation} — ${c.phone}`
        );
      });
    }

    doc.moveDown(1);

    // ------------------------------------------
    // NOTES
    // ------------------------------------------
    doc.fontSize(16).text("Internal Notes", { underline: true });
    doc.moveDown(0.6);

    if (employee.notes.length === 0) {
      doc.fontSize(12).text("No internal notes.");
    } else {
      employee.notes.forEach((n) => {
        doc.fontSize(12).text(
          `• ${dayjs(n.createdAt).format("MMM D, YYYY")}: ${n.note}`
        );
      });
    }

    // ------------------------------------------
    // AUDIT LOG
    // ------------------------------------------
    await createAuditLog({
      action: AuditActions.SYSTEM_ACTION,
      entityType: "Employee",
      entityId: employee.id,
      metadata: {
        event: "EMPLOYEE_PROFILE_PDF_GENERATED",
        generatedAt: new Date().toISOString(),
      },
    });

    doc.end();
  } catch (error) {
    console.error("Employee PDF error:", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
