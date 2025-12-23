// src/modules/reports/timesheetPdf.routes.ts

import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { PrismaClient } from "@prisma/client";

import { uploadPdfToS3 } from "../../utils/uploadPdfToS3";
import { mailer } from "../../utils/emailClient";

dayjs.extend(utc);

const prisma = new PrismaClient();
const router = Router();

/**
 * ----------------------------------------------------------
 * GET /api/reports/timesheet/pdf
 * Streams PDF
 * Uploads to S3
 * Emails employee
 * ----------------------------------------------------------
 */
router.get("/timesheet/pdf", async (req: Request, res: Response) => {
  try {
    const { employeeId, start, end } = req.query;

    if (!employeeId || !start || !end) {
      return res.status(400).json({
        error: "employeeId, start, and end are required",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: Number(employeeId) },
      include: { organization: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const punches = await prisma.punch.findMany({
      where: {
        employeeId: employee.id,
        timestamp: {
          gte: new Date(`${start}T00:00:00`),
          lte: new Date(`${end}T23:59:59`),
        },
      },
      orderBy: { timestamp: "asc" },
    });

    const filename = `timesheet_${employee.firstName}_${employee.lastName}_${start}_to_${end}.pdf`
      .replace(/\s+/g, "_")
      .toLowerCase();

    // ---------------------------------------------
    // Stream PDF
    // ---------------------------------------------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    const doc = new PDFDocument({ size: "LETTER", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", async () => {
      const buffer = Buffer.concat(chunks);

      // Upload to S3
      try {
        await uploadPdfToS3({
          organizationId: employee.organizationId,
          employeeId: employee.id,
          filename,
          buffer,
          contentType: "application/pdf",
        });
      } catch (err) {
        console.error("S3 upload failed:", err);
      }

      // Email employee
      try {
        if (employee.email) {
          await mailer.sendMail({
            from: "no-reply@timewiseclock.com",
            to: employee.email,
            subject: `Your Timesheet (${start} - ${end})`,
            text: "Your timesheet is attached.",
            attachments: [{ filename, content: buffer }],
          });
        }
      } catch (err) {
        console.error("Email failed:", err);
      }
    });

    doc.pipe(res);

    // ---------------------------------------------
    // PDF CONTENT
    // ---------------------------------------------
    doc.fontSize(18).text("Employee Timesheet", { align: "center" }).moveDown();

    doc
      .fontSize(10)
      .text(`Employee: ${employee.firstName} ${employee.lastName}`)
      .text(`Organization: ${employee.organization.name}`)
      .text(`Period: ${start} → ${end}`)
      .moveDown();

    doc.fontSize(12).text("Punches").moveDown(0.5);
    doc.fontSize(10).text("Date & Time           Type");
    doc.moveDown(0.5);

    for (const p of punches) {
      const ts = dayjs.utc(p.timestamp).format("YYYY-MM-DD HH:mm");
      doc.text(`${ts}        ${p.type}`);
    }

    doc.moveDown(2);
    doc.text("Employee Signature: ________________________________");
    doc.moveDown();
    doc.text("Supervisor Signature: ________________________________");

    doc.end();
  } catch (err: any) {
    console.error("Timesheet PDF error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * ----------------------------------------------------------
 * GET /api/reports/timesheet/pdf/meta
 * Metadata only (no streaming)
 * ----------------------------------------------------------
 */
router.get("/timesheet/pdf/meta", async (req: Request, res: Response) => {
  try {
    const { employeeId, start, end, email } = req.query;

    if (!employeeId || !start || !end) {
      return res.status(400).json({
        error: "employeeId, start, and end are required",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: Number(employeeId) },
      include: { organization: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const filename = `timesheet_${employee.firstName}_${employee.lastName}_${start}_to_${end}.pdf`
      .replace(/\s+/g, "_")
      .toLowerCase();

    const doc = new PDFDocument({ size: "LETTER", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(c));
    const pdfPromise = new Promise<Buffer>((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    );

    doc.fontSize(16).text("Timesheet Summary", { align: "center" }).moveDown();
    doc.fontSize(10).text(`Employee: ${employee.firstName} ${employee.lastName}`);
    doc.text(`Period: ${start} → ${end}`);
    doc.text("Use the full PDF endpoint for details.");
    doc.end();

    const buffer = await pdfPromise;

    const s3 = await uploadPdfToS3({
      organizationId: employee.organizationId,
      employeeId: employee.id,
      filename,
      buffer,
      contentType: "application/pdf",
    });

    if (email === "true" && employee.email) {
      await mailer.sendMail({
        from: "no-reply@timewiseclock.com",
        to: employee.email,
        subject: `Your Timesheet (${start} - ${end})`,
        text: "Your timesheet is attached.",
        attachments: [{ filename, content: buffer }],
      });
    }

    return res.json({
      success: true,
      pdfUrl: s3.url,
      s3Key: s3.key,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
      },
      range: { start, end },
    });
  } catch (err: any) {
    console.error("Meta PDF error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
