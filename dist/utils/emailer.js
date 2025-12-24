"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTimesheetEmail = sendTimesheetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
async function sendTimesheetEmail({ to, pdfBuffer, filename, employeeId, start, end }) {
    await transporter.sendMail({
        from: `"TimeWise" <no-reply@timewise.com>`,
        to,
        subject: `Timesheet Report for Employee ${employeeId}`,
        html: `
      <h3>Timesheet Available</h3>
      <p>Your timesheet for <b>${start}</b> → <b>${end}</b> is ready.</p>
    `,
        attachments: [
            {
                filename,
                content: pdfBuffer
            }
        ]
    });
}
