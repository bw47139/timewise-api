"use strict";
// src/modules/reports/timesheetPdf.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTimesheetPdf = generateTimesheetPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const dayjs_1 = __importDefault(require("dayjs"));
const client_1 = require("@prisma/client");
const uploadPdfToS3_1 = require("../../utils/uploadPdfToS3");
const prisma = new client_1.PrismaClient();
async function generateTimesheetPdf({ organizationId, employeeId, start, end, }) {
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
    const doc = new pdfkit_1.default({ margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => { });
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
        doc.text(`${(0, dayjs_1.default)(p.timestamp).format("YYYY-MM-DD HH:mm")}          ${p.type}`);
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
    const uploaded = await (0, uploadPdfToS3_1.uploadPdfToS3)({
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
