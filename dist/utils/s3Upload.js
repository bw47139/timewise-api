"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const s3 = new aws_sdk_1.default.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});
async function uploadToS3(buffer, key) {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf"
    };
    const res = await s3.upload(params).promise();
    return res.Location; // URL
}
