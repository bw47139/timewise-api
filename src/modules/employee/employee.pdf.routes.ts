// src/modules/employee/employee.pdf.routes.ts

import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

import { uploadPdfToS3 } from "../../utils/uploadPdfToS3";

const prisma = new PrismaClient();
const router = Router();

/**
 * ------------------------------------------------------
 * GET /api/employee/pdf/:id
 * Generates Employee Profile PDF & uploads to S3
 * ------------------------------------------------------
 */
router.get("/pdf/:id", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const { organizationId } = (req as any).user || {};

    if (!employeeId || !organizationId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // ------------------------------------------
    // Load employee with related data
    // ------------------------------------------
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
        isDeleted: false,
      },
      include: {
        payRates: {
          orderBy: { effectiveDate: "desc" },
        },
        emergencyContacts: true,
        notes: true,
        documents: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ------------------------------------------
    // Create PDF buffer
    // ------------------------------------------
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    doc.on("end", async () => {
      const buffer = Buffer.concat(chunks);

      const filename = `employee-profile-${employee.id}.pdf`;

      const result = await uploadPdfToS3({
        organizationId,
        employeeId,
        filename,
        buffer,
        contentType: "application/pdf", // ✅ REQUIRED
      });

      return res.json({
        success: true,
        ...result,
      });
    });

    // ------------------------------------------
    // HEADER
    // ------------------------------------------
    doc.fontSize(20).text("Employee Profile Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(dayjs().format("MMMM D, YYYY"), {
      align: "center",
    });
    doc.moveDown(1.5);

    // ------------------------------------------
    // PERSONAL INFO
    // ------------------------------------------
    doc.fontSize(16).text("Personal Information", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(
      `Name: ${employee.firstName} ${employee.lastName}`
    );
    if (employee.preferredName) {
      doc.text(`Preferred Name: ${employee.preferredName}`);
    }
    doc.text(`Email: ${employee.email || "—"}`);
    doc.text(`Phone: ${employee.phoneNumber || "—"}`);
    doc.text(`Address: ${employee.addressLine1 || ""}`);
    if (employee.addressLine2) {
      doc.text(employee.addressLine2);
    }
    doc.text(
      `${employee.city || ""}, ${employee.state || ""} ${
        employee.postalCode || ""
      }`
    );
    doc.moveDown(1);

    // ------------------------------------------
    // EMPLOYMENT INFO
    // ------------------------------------------
    doc.fontSize(16).text("Employment Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Job Title: ${employee.jobTitle || "—"}`);
    doc.text(`Department: ${employee.department || "—"}`);
    doc.text(
      `Hire Date: ${
        employee.hireDate
          ? dayjs(employee.hireDate).format("MMM D, YYYY")
          : "—"
      }`
    );
    doc.text(`Status: ${employee.status}`);
    doc.moveDown(1);

    // ------------------------------------------
    // PAY RATE HISTORY
    // ------------------------------------------
    doc.fontSize(16).text("Pay Rate History", { underline: true });
    doc.moveDown(0.4);

    if (employee.payRates.length === 0) {
      doc.fontSize(12).text("No pay rate records found.");
    } else {
      employee.payRates.forEach((rate) => {
        doc.fontSize(12).text(
          `• $${rate.rate.toFixed(2)} starting ${dayjs(
            rate.effectiveDate
          ).format("MMM D, YYYY")}`
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
          `• ${c.name} — ${c.relationship} — ${c.phone}`
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
          `• ${dayjs(n.createdAt).format("MMM D, YYYY")}: ${n.text}`
        );
      });
    }
    doc.moveDown(1);

    // ------------------------------------------
    // DOCUMENTS
    // ------------------------------------------
    doc.fontSize(16).text("Uploaded Documents", { underline: true });
    doc.moveDown(0.6);

    if (employee.documents.length === 0) {
      doc.fontSize(12).text("No uploaded documents.");
    } else {
      employee.documents.forEach((d) => {
        doc.fontSize(12).text(
          `• ${d.fileName} — ${dayjs(d.createdAt).format("MMM D, YYYY")}`
        );
      });
    }

    // ------------------------------------------
    // END PDF STREAM
    // ------------------------------------------
    doc.end();
  } catch (err) {
    console.error("❌ Employee PDF error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate employee PDF" });
  }
});

export default router;
