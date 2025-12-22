import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!
  }
});

export async function sendTimesheetEmail({
  to,
  pdfBuffer,
  filename,
  employeeId,
  start,
  end
}: any) {
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
