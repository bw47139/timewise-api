// src/modules/reports/timesheetPdf.service.ts

import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

import { uploadPdfToS3 } from "../../utils/uploadPdfToS3";

const prisma = new PrismaClient();

interface GenerateTimesheetOptions {
  organizationId: number;
  employeeId: number;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export async function generateTimesheetPdf({
  organizationId,
  employeeId,
  start,
  end,
}: GenerateTimesheetOptions) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);

  // --------------------------------------------------
  // Load employee
  // --------------------------------------------------
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { organization: true },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  // --------------------------------------------------
  // Load punches (FIXED FIELD NAMES)
  // --------------------------------------------------
  const punches = await prisma.punch.findMany({
    where: {
      employeeId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  // --------------------------------------------------
  // Create PDF
  // --------------------------------------------------
  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => {});

  // --------------------------------------------------
  // Header
  // --------------------------------------------------
  doc.fontSize(22).text("Employee Timesheet", { align: "center" });
  doc.moveDown();

  doc.fontSize(12)
    .text(`Company: ${employee.organization?.name ?? ""}`)
    .text(`Employee: ${employee.firstName} ${employee.lastName}`)
    .text(`Employee ID: ${employee.id}`)
    .text(`Period: ${start} → ${end}`)
    .moveDown();

  // --------------------------------------------------
  // Punch Table
  // --------------------------------------------------
  doc.fontSize(13).text("Punches", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).text("Date / Time                 Type");
  doc.moveDown(0.5);

  for (const p of punches) {
    doc.text(
      `${dayjs(p.timestamp).format("YYYY-MM-DD HH:mm")}          ${p.type}`
    );
  }

  doc.moveDown(2);

  // --------------------------------------------------
  // Signatures
  // --------------------------------------------------
  doc.text("Employee Signature: ________________________________");
  doc.moveDown();
  doc.text("Supervisor Signature: ________________________________");

  doc.end();

  const buffer = Buffer.concat(chunks);

  // --------------------------------------------------
  // Upload to S3 (FIXED: contentType REQUIRED)
  // --------------------------------------------------
  const uploaded = await uploadPdfToS3({
    organizationId,
    employeeId,
    filename: `timesheet-${start}-to-${end}.pdf`,
    buffer,
    contentType: "application/pdf",
  });

  return {
    url: uploaded.url,
    key: uploaded.key,
  };
}
