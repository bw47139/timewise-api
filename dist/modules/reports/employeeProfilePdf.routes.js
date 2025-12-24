"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/reports/employeeProfilePdf.routes.ts
const express_1 = require("express");
const pdfkit_1 = __importDefault(require("pdfkit"));
const prisma_1 = require("../../prisma");
const uploadPdfToS3_1 = require("../../utils/uploadPdfToS3");
const dayjs_1 = __importDefault(require("dayjs"));
const router = (0, express_1.Router)();
/**
 * GET /api/reports/employee/:id/profile/pdf
 */
router.get("/employee/:id/profile/pdf", async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        if (!employeeId) {
            return res.status(400).json({ error: "Invalid employee id" });
        }
        // ---------------------------------------------------
        // Load all employee data
        // ---------------------------------------------------
        const employee = await prisma_1.prisma.employee.findUnique({
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
        const doc = new pdfkit_1.default({ margin: 50 });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", async () => {
            const pdfBuffer = Buffer.concat(chunks);
            // Upload to S3 and return URL
            const saved = await (0, uploadPdfToS3_1.uploadPdfToS3)({
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
        }
        else {
            employee.payRates.forEach((rate) => {
                doc.text(`Rate: $${rate.rate.toFixed(2)} — Effective: ${(0, dayjs_1.default)(rate.effectiveDate).format("MM/DD/YYYY")}`);
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
        }
        else {
            employee.notes.forEach((note) => {
                doc.text(`• ${note.note}`);
                if (note.createdAt)
                    doc.text(`   (${(0, dayjs_1.default)(note.createdAt).format("MM/DD/YYYY hh:mm A")})`);
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
        }
        else {
            employee.documents.forEach((d) => {
                doc.text(`• ${d.fileName} — ${(0, dayjs_1.default)(d.createdAt).format("MM/DD/YYYY")}`);
                doc.moveDown(0.3);
            });
        }
        doc.end();
    }
    catch (err) {
        console.error("employee profile pdf error:", err);
        return res.status(500).json({ error: "Failed to generate PDF" });
    }
});
exports.default = router;
