import { RekognitionClient } from "@aws-sdk/client-rekognition";

/**
 * Small helper to avoid undefined / whitespace env issues
 */
function clean(value?: string) {
  return (value || "").trim();
}

/**
 * ================================
 * ENV VARIABLES
 * ================================
 */
export const AWS_REKOGNITION_REGION =
  clean(process.env.AWS_REKOGNITION_REGION) || "us-east-1";

export const AWS_ACCESS_KEY_ID = clean(process.env.AWS_ACCESS_KEY_ID);
export const AWS_SECRET_ACCESS_KEY = clean(process.env.AWS_SECRET_ACCESS_KEY);

// REQUIRED collection ID
export const COLLECTION_ID = clean(
  process.env.AWS_REKOGNITION_COLLECTION_ID
);

/**
 * ================================
 * VALIDATION (FAIL FAST)
 * ================================
 */
if (!AWS_ACCESS_KEY_ID) {
  console.error("❌ AWS_ACCESS_KEY_ID is missing");
}

if (!AWS_SECRET_ACCESS_KEY) {
  console.error("❌ AWS_SECRET_ACCESS_KEY is missing");
}

if (!COLLECTION_ID) {
  console.error(
    "❌ AWS_REKOGNITION_COLLECTION_ID is missing — face features will FAIL"
  );
}

console.log("🧠 Rekognition Region:", AWS_REKOGNITION_REGION);
console.log("🧠 Rekognition Collection:", COLLECTION_ID);

/**
 * ================================
 * CLIENT
 * ================================
 */
export const rekognitionClient = new RekognitionClient({
  region: AWS_REKOGNITION_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});
