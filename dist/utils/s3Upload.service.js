"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdfToS3 = uploadPdfToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client_1 = require("../utils/s3Client");
async function uploadPdfToS3({ organizationId, employeeId, filename, buffer, }) {
    const bucket = process.env.AWS_S3_BUCKET;
    const key = `timesheets/${organizationId}/${employeeId}/${Date.now()}-${filename}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
        ACL: "private", // keep secure
    });
    await s3Client_1.s3Client.send(command);
    return {
        key,
        url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
}
