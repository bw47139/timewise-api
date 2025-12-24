"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdfToS3 = uploadPdfToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client_1 = require("./s3Client");
async function uploadPdfToS3({ organizationId, employeeId, filename, buffer, contentType, }) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
        throw new Error("AWS_S3_BUCKET is not set");
    }
    // Extract extension
    const ext = filename.split(".").pop() || "jpg";
    // Generate S3 key
    const key = employeeId
        ? `employees/employee-${employeeId}-${Date.now()}.${ext}`
        : `uploads/${Date.now()}.${ext}`;
    // IMPORTANT: DO NOT USE ACL — bucket owner enforced disables ACLs
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    await s3Client_1.s3Client.send(command);
    // Return public URL
    return {
        key,
        url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
}
