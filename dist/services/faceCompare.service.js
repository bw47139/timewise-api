"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareFaces = compareFaces;
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const client = new client_rekognition_1.RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});
async function compareFaces(capturedBase64, employeePhotoUrl) {
    try {
        // ------------------------------
        // Convert captured face to buffer
        // ------------------------------
        const capturedBytes = Buffer.from(capturedBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
        // ------------------------------
        // Download employee reference photo
        // ------------------------------
        const employeePhotoBuffer = await fetch(employeePhotoUrl).then((r) => r.arrayBuffer());
        // ------------------------------
        // Build Rekognition request
        // ------------------------------
        const command = new client_rekognition_1.CompareFacesCommand({
            SourceImage: { Bytes: capturedBytes },
            TargetImage: { Bytes: Buffer.from(employeePhotoBuffer) },
            SimilarityThreshold: 85,
        });
        const response = await client.send(command);
        // ------------------------------
        // ⭐ FIX — Force strict boolean return
        // ------------------------------
        const hasMatch = Array.isArray(response.FaceMatches) &&
            response.FaceMatches.length > 0;
        return hasMatch; // always boolean
    }
    catch (error) {
        console.error("Face compare error:", error);
        return false;
    }
}
