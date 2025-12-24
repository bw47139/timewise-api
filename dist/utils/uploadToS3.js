"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
// src/utils/uploadToS3.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client_1 = require("./s3Client");
async function uploadToS3({ buffer, filename, contentType }) {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_S3_REGION;
    if (!bucket) {
        console.error("❌ Missing AWS_S3_BUCKET");
        throw new Error("AWS_S3_BUCKET missing");
    }
    if (!region) {
        console.error("❌ Missing AWS_S3_REGION");
        throw new Error("AWS_S3_REGION missing");
    }
    const key = `employees/${Date.now()}-${filename}`;
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: "public-read",
        });
        await s3Client_1.s3Client.send(command);
        return {
            key,
            url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
        };
    }
    catch (error) {
        console.error("❌ S3 Upload Error:", error);
        throw new Error("Failed to upload to S3");
    }
}
