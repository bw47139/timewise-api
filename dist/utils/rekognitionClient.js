"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rekognitionClient = exports.COLLECTION_ID = exports.AWS_SECRET_ACCESS_KEY = exports.AWS_ACCESS_KEY_ID = exports.AWS_REKOGNITION_REGION = void 0;
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
/**
 * Trim env values safely
 */
function clean(value) {
    return (value || "").trim();
}
/**
 * IMPORTANT:
 * - S3 can stay in us-east-2
 * - Rekognition MUST use us-east-1
 */
exports.AWS_REKOGNITION_REGION = clean(process.env.AWS_REKOGNITION_REGION) || "us-east-1";
exports.AWS_ACCESS_KEY_ID = clean(process.env.AWS_ACCESS_KEY_ID);
exports.AWS_SECRET_ACCESS_KEY = clean(process.env.AWS_SECRET_ACCESS_KEY);
exports.COLLECTION_ID = clean(process.env.AWS_REKOGNITION_COLLECTION_ID);
// --------------------------------------------------
// ENV VALIDATION (fail loud)
// --------------------------------------------------
if (!exports.AWS_ACCESS_KEY_ID)
    throw new Error("❌ AWS_ACCESS_KEY_ID is missing");
if (!exports.AWS_SECRET_ACCESS_KEY)
    throw new Error("❌ AWS_SECRET_ACCESS_KEY is missing");
if (!exports.COLLECTION_ID)
    throw new Error("❌ AWS_REKOGNITION_COLLECTION_ID is missing");
console.log("🧠 Rekognition Region:", exports.AWS_REKOGNITION_REGION);
console.log("🧠 Rekognition Collection:", exports.COLLECTION_ID);
// --------------------------------------------------
// REKOGNITION CLIENT (CORRECT REGION)
// --------------------------------------------------
exports.rekognitionClient = new client_rekognition_1.RekognitionClient({
    region: exports.AWS_REKOGNITION_REGION,
    credentials: {
        accessKeyId: exports.AWS_ACCESS_KEY_ID,
        secretAccessKey: exports.AWS_SECRET_ACCESS_KEY,
    },
});
