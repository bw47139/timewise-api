// src/modules/reports/timesheetPdf.routes.ts
import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { timecardService } from "../timecard/timecard.service";
import { uploadPdfToS3 } from "../../utils/uploadPdfToS3";
import { mailer } from "../../utils/emailClient";

dayjs.extend(utc);

const router = Router();

/**
 * GET /api/reports/timesheet/pdf
 * Streams PDF to browser
 * Uploads to S3
 * Emails employee
 */
router.get("/timesheet/pdf", async (req: Request, res: Response) => {
  try {
    const { employeeId, start, end } = req.query;

    if (!employeeId || !start || !end) {
      return res.status(400).json({
        error: "employeeId, start, and end are required",
      });
    }

    const summary = await timecardService.getSummary(
      Number(employeeId),
      String(start),
      String(end)
    );

    const employee = summary.employee;
    const range = summary.range;

    const filename = `timesheet_${employee.firstName}_${employee.lastName}_${range.start}_to_${range.end}.pdf`
      .replace(/\s+/g, "_")
      .toLowerCase();

    // STREAM PDF INLINE
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    const doc = new PDFDocument({ size: "LETTER", margin: 40 });

    // Collect PDF to upload/email
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Upload to S3
      try {
        const s3 = await uploadPdfToS3({
          organizationId: employee.organizationId!,
          employeeId: employee.id,
          filename,
          buffer: pdfBuffer,
        });
        console.log("PDF uploaded to S3:", s3.url);
      } catch (err) {
        console.error("S3 upload failed:", err);
      }

      // Email PDF
      try {
        await mailer.sendMail({
          from: "no-reply@timewiseclock.com",
          to: employee.email ?? "test@example.com",
          subject: `Your Timesheet (${range.start} - ${range.end})`,
          text: "Your timesheet is attached.",
          attachments: [{ filename, content: pdfBuffer }],
        });
        console.log("Timesheet emailed!");
      } catch (err) {
        console.error("Email send failed:", err);
      }
    });

    // Begin piping PDF to browser
    doc.pipe(res);

    // -------------------------------------------
    // PDF CONTENT (layout + shifts + missing punches)
    // -------------------------------------------
    doc.fontSize(18).text("Employee Timesheet", { align: "center" }).moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Employee: ${employee.firstName} ${employee.lastName}`)
      .text(`Organization: ${employee.organizationName ?? "N/A"}`)
      .text(`Location: ${employee.locationName ?? "N/A"}`)
      .text(`Period: ${range.start} → ${range.end}`)
      .moveDown(1);

    const startX = 40;
    let y = doc.y;

    const drawHeader = () => {
      doc.fontSize(10);
      doc.text("DATE", startX, y);
      doc.text("IN", startX + 80, y);
      doc.text("OUT", startX + 150, y);
      doc.text("TOTAL", startX + 230, y);
      doc.text("REG", startX + 310, y);
      doc.text("OT", startX + 380, y);
      doc.text("DT", startX + 450, y);

      y += 15;
      doc.moveTo(startX, y).lineTo(startX + 520, y).stroke();
      y += 5;
    };

    const checkPageBreak = () => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 40;
        drawHeader();
      }
    };

    drawHeader();

    for (const day of summary.days) {
      const anyDay: any = day;

      const shifts = day.pairedShifts ?? [];
      const missingPunches = anyDay.unpairedPunches ?? anyDay.missingPunches ?? [];
      const autoLunchMinutes = anyDay.autoLunchMinutes ?? anyDay.autoLunchDeductMinutes ?? 0;

      // No shifts
      if (!shifts.length) {
        checkPageBreak();

        doc.fontSize(10);
        doc.text(day.date, startX, y);
        doc.text("-", startX + 80, y);
        doc.text("-", startX + 150, y);
        doc.text(day.formattedTotal, startX + 230, y);
        doc.text(day.formattedRegular, startX + 310, y);
        doc.text(day.formattedOvertime, startX + 380, y);
        doc.text(day.formattedDoubletime, startX + 450, y);

        y += 15;

        if (missingPunches.length > 0) {
          doc.fillColor("red").fontSize(8);
          doc.text("Missing punches today!", startX + 80, y);
          doc.fillColor("black");
          y += 12;
        }

        continue;
      }

      // Multiple shifts printed separately
      for (let i = 0; i < shifts.length; i++) {
        const shift = shifts[i];
        const first = i === 0;

        checkPageBreak();

        doc.fontSize(10);
        doc.text(first ? day.date : "", startX, y);

        const inTs = shift.IN?.timestamp;
        const outTs = shift.OUT?.timestamp;

        doc.text(inTs ? formatTime(inTs) : "-", startX + 80, y);
        doc.text(outTs ? formatTime(outTs) : "-", startX + 150, y);

        if (first) {
          doc.text(day.formattedTotal, startX + 230, y);
          doc.text(day.formattedRegular, startX + 310, y);
          doc.text(day.formattedOvertime, startX + 380, y);
          doc.text(day.formattedDoubletime, startX + 450, y);
        }

        y += 15;
      }

      if (autoLunchMinutes > 0) {
        checkPageBreak();
        doc.fontSize(8).text(`Auto lunch deduction applied: -${autoLunchMinutes} minutes`, startX + 80, y);
        y += 10;
      }

      if (missingPunches.length > 0) {
        checkPageBreak();
        doc.fontSize(8).fillColor("red");
        doc.text("Missing punches:", startX + 80, y);
        y += 10;

        for (const mp of missingPunches) {
          const ts = mp.timestamp ?? mp.punchTime;
          doc.text(`- ${mp.punchType ?? "Punch"} @ ${ts ? formatTime(ts) : "?"}`, startX + 95, y);
          y += 10;
        }

        doc.fillColor("black");
      }
    }

    // SIGNATURES
    y = doc.y + 40;
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 60;
    }

    doc
      .fontSize(10)
      .text("Employee Signature: ________________________________", startX, y);
    y += 20;
    doc.text("Supervisor Signature: ______________________________", startX, y);

    doc.end();
  } catch (err: any) {
    console.error("Timesheet PDF error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * JSON-only metadata endpoint
 * Does NOT stream PDF
 * Does NOT set PDF headers
 */
router.get("/timesheet/pdf/meta", async (req: Request, res: Response) => {
  try {
    const { employeeId, start, end, email } = req.query;

    if (!employeeId || !start || !end) {
      return res.status(400).json({
        error: "employeeId, start, and end are required",
      });
    }

    const summary = await timecardService.getSummary(
      Number(employeeId),
      String(start),
      String(end)
    );

    const employee = summary.employee;
    const range = summary.range;

    const filename = `timesheet_${employee.firstName}_${employee.lastName}_${range.start}_to_${range.end}.pdf`
      .replace(/\s+/g, "_")
      .toLowerCase();

    // Build PDF in memory ONLY
    const PDF = require("pdfkit");
    const doc = new PDF({ size: "LETTER", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Simple meta PDF
    doc.fontSize(16).text("Timesheet (Meta Only)", { align: "center" }).moveDown();
    doc.fontSize(10).text(`Employee: ${employee.firstName} ${employee.lastName}`);
    doc.text(`Period: ${range.start} → ${range.end}`);
    doc.text(`Location: ${employee.locationName ?? "N/A"}`);
    doc.text("(Full PDF available at /timesheet/pdf)").moveDown();
    doc.end();

    const pdfBuffer = await pdfPromise;

    // Upload to S3
    const s3 = await uploadPdfToS3({
      organizationId: employee.organizationId!,
      employeeId: employee.id,
      filename,
      buffer: pdfBuffer,
    });

    // Optional ?email=true
    if (email === "true") {
      await mailer.sendMail({
        from: "no-reply@timewiseclock.com",
        to: employee.email ?? "test@example.com",
        subject: `Your Timesheet (${range.start} - ${range.end})`,
        text: "Your timesheet is attached.",
        attachments: [{ filename, content: pdfBuffer }],
      });
    }

    const totals: any = summary.totalHours ?? {};

    return res.json({
      success: true,
      pdfUrl: s3.url,
      s3Key: s3.key,

      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        location: employee.locationName,
        organizationId: employee.organizationId,
      },

      range,

      totals: {
        regular: totals.regularHours ?? 0,
        overtime: totals.overtimeHours ?? 0,
        doubletime: totals.doubletimeHours ?? 0,
        total: totals.totalHours ?? 0,
      },
    });
  } catch (err: any) {
    console.error("Meta PDF error:", err);
    return res.status(500).json({
      error: err.message || "Unable to generate metadata",
    });
  }
});

export default router;

// Helper
function formatTime(ts: string | Date) {
  const d = dayjs.utc(ts);
  return `${d.hour().toString().padStart(2, "0")}:${d
    .minute()
    .toString()
    .padStart(2, "0")}`;
}
