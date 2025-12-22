import PDFDocument from "pdfkit";

import { prisma } from "../../prisma";
import { uploadPdfToS3 } from "../../utils/uploadPdfToS3";
import { prisma } from "../../prisma"; // adjust if your prisma path differs

interface GenerateTimesheetOptions {
  organizationId: number;
  employeeId: number;
  start: string; // yyyy-mm-dd
  end: string;
}

export async function generateTimesheetPdf({
  organizationId,
  employeeId,
  start,
  end,
}: GenerateTimesheetOptions) {
  // -----------------------------
  // 1. Fetch employee + punches
  // -----------------------------
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { organization: true },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const punches = await prisma.punch.findMany({
    where: {
      employeeId,
      punchTime: {
        gte: new Date(start + "T00:00:00"),
        lte: new Date(end + "T23:59:59"),
      },
    },
    orderBy: { punchTime: "asc" },
  });

  // -----------------------------
  // 2. Start generating PDF
  // -----------------------------
  const doc = new PDFDocument({ margin: 40 });
  const chunks: any[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => {});

  // -----------------------------
  // PDF HEADER
  // -----------------------------
  doc.fontSize(22).text("Employee Timesheet", { align: "center" });
  doc.moveDown();

  doc
    .fontSize(12)
    .text(`Company: ${employee.organization.name}`)
    .text(`Employee: ${employee.firstName} ${employee.lastName}`)
    .text(`Employee ID: ${employee.id}`)
    .text(`Period: ${start} → ${end}`)
    .moveDown();

  // -----------------------------
  // TABLE HEADER
  // -----------------------------
  doc.fontSize(13).text("Punches:", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).text("Time                  Type");

  doc.moveDown(0.5);

  // -----------------------------
  // TABLE ROWS
  // -----------------------------
  for (const p of punches) {
    const t = new Date(p.punchTime).toLocaleString();
    const type = p.punchType;
    doc.text(`${t}      ${type}`);
  }

  doc.moveDown(2);

  // -----------------------------
  // SIGNATURE SECTION
  // -----------------------------
  doc
    .fontSize(12)
    .text("Employee Signature: ________________________________")
    .moveDown();
  doc.text("Supervisor Signature: ________________________________");

  // Finish PDF
  doc.end();

  const buffer = Buffer.concat(chunks);

  // -----------------------------
  // 3. Upload to S3
  // -----------------------------
  const uploaded = await uploadPdfToS3({
    organizationId,
    employeeId,
    filename: `timesheet-${start}-to-${end}.pdf`,
    buffer,
  });

  return {
    url: uploaded.url,
    key: uploaded.key,
  };
}
