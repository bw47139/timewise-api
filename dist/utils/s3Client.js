"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
function clean(value) {
    return (value || "").trim();
}
const region = clean(process.env.AWS_REGION) || "us-east-2";
const accessKeyId = clean(process.env.AWS_ACCESS_KEY_ID);
const secretAccessKey = clean(process.env.AWS_SECRET_ACCESS_KEY);
if (!region)
    console.error("❌ AWS_REGION missing");
if (!accessKeyId)
    console.error("❌ AWS_ACCESS_KEY_ID missing");
if (!secretAccessKey)
    console.error("❌ AWS_SECRET_ACCESS_KEY missing");
exports.s3Client = new client_s3_1.S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});
