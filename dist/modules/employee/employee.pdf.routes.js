"use strict";
// src/modules/employee/employee.pdf.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdfkit_1 = __importDefault(require("pdfkit"));
const dayjs_1 = __importDefault(require("dayjs"));
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const audit_actions_1 = require("../audit/audit.actions");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
/**
 * ----------------------------------------------------------
 * GET /api/employee/:id/profile/pdf
 * ----------------------------------------------------------
 */
router.get("/pdf/:id", async (req, res) => {
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
        const doc = new pdfkit_1.default({ margin: 40 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=employee-${employee.id}.pdf`);
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
        doc.fontSize(12).text(`Hire Date: ${employee.hireDate
            ? (0, dayjs_1.default)(employee.hireDate).format("MMM D, YYYY")
            : "—"}`);
        doc.moveDown(1);
        // ------------------------------------------
        // PAY RATES
        // ------------------------------------------
        doc.fontSize(16).text("Pay Rates", { underline: true });
        doc.moveDown(0.6);
        if (employee.payRates.length === 0) {
            doc.fontSize(12).text("No pay rates available.");
        }
        else {
            employee.payRates.forEach((rate) => {
                doc.fontSize(12).text(`• $${rate.rate.toFixed(2)} (effective ${(0, dayjs_1.default)(rate.effectiveDate).format("MMM D, YYYY")})`);
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
        }
        else {
            employee.emergencyContacts.forEach((c) => {
                doc.fontSize(12).text(`• ${c.name} — ${c.relation} — ${c.phone}`);
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
        }
        else {
            employee.notes.forEach((n) => {
                doc.fontSize(12).text(`• ${(0, dayjs_1.default)(n.createdAt).format("MMM D, YYYY")}: ${n.note}`);
            });
        }
        // ------------------------------------------
        // AUDIT LOG
        // ------------------------------------------
        await (0, audit_service_1.createAuditLog)({
            action: audit_actions_1.AuditActions.SYSTEM_ACTION,
            entityType: "Employee",
            entityId: employee.id,
            metadata: {
                event: "EMPLOYEE_PROFILE_PDF_GENERATED",
                generatedAt: new Date().toISOString(),
            },
        });
        doc.end();
    }
    catch (error) {
        console.error("Employee PDF error:", error);
        return res.status(500).json({ error: "Failed to generate PDF" });
    }
});
exports.default = router;
