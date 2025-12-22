// src/modules/reports/employeeProfilePdf.routes.ts
import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../../prisma";
import { uploadPdfToS3 } from "../../utils/uploadPdfToS3";
import dayjs from "dayjs";

const router = Router();

/**
 * GET /api/reports/employee/:id/profile/pdf
 */
router.get("/employee/:id/profile/pdf", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    if (!employeeId) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    // ---------------------------------------------------
    // Load all employee data
    // ---------------------------------------------------
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        payRates: { orderBy: { effectiveDate: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        documents: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ---------------------------------------------------
    // Create PDF using PDFKit
    // ---------------------------------------------------
    const doc = new PDFDocument({ margin: 50 });
    const chunks: any[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Upload to S3 and return URL
      const saved = await uploadPdfToS3({
        organizationId: employee.organizationId,
        employeeId: employeeId,
        filename: `employee-profile-${employeeId}.pdf`,
        buffer: pdfBuffer,
      });

      res.json({
        success: true,
        url: saved.url,
        key: saved.key,
      });
    });

    // ---------------------------------------------------
    // PDF HEADER
    // ---------------------------------------------------
    doc.fontSize(20).text("Employee Profile Report", { align: "center" });
    doc.moveDown();

    // ===================================================
    // BASIC INFO
    // ===================================================
    doc.fontSize(14).text("Basic Information", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text(`Name: ${employee.firstName} ${employee.lastName}`);
    doc.text(`Email: ${employee.email || "-"}`);
    doc.text(`Status: ${employee.status}`);
    doc.text(`Hired: ${employee.createdAt.toDateString()}`);
    if (employee.terminatedAt) {
      doc.text(`Terminated: ${employee.terminatedAt.toDateString()}`);
      doc.text(`Reason: ${employee.terminationReason || "-"}`);
    }

    doc.moveDown();

    // ===================================================
    // PAY RATES
    // ===================================================
    doc.fontSize(14).text("Pay Rates", { underline: true });
    doc.moveDown(0.5);

    if (employee.payRates.length === 0) {
      doc.text("No pay rates found.");
    } else {
      employee.payRates.forEach((rate) => {
        doc.text(
          `Rate: $${rate.rate.toFixed(2)} — Effective: ${dayjs(
            rate.effectiveDate
          ).format("MM/DD/YYYY")}`
        );
      });
    }

    doc.moveDown();

    // ===================================================
    // NOTES
    // ===================================================
    doc.fontSize(14).text("Notes", { underline: true });
    doc.moveDown(0.5);

    if (employee.notes.length === 0) {
      doc.text("No notes found.");
    } else {
      employee.notes.forEach((note) => {
        doc.text(`• ${note.note}`);
        if (note.createdAt)
          doc.text(
            `   (${dayjs(note.createdAt).format("MM/DD/YYYY hh:mm A")})`
          );
        doc.moveDown(0.3);
      });
    }

    doc.moveDown();

    // ===================================================
    // DOCUMENTS
    // ===================================================
    doc.fontSize(14).text("Documents", { underline: true });
    doc.moveDown(0.5);

    if (employee.documents.length === 0) {
      doc.text("No documents uploaded.");
    } else {
      employee.documents.forEach((d) => {
        doc.text(
          `• ${d.fileName} — ${dayjs(d.createdAt).format("MM/DD/YYYY")}`
        );
        doc.moveDown(0.3);
      });
    }

    doc.end();
  } catch (err) {
    console.error("employee profile pdf error:", err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
