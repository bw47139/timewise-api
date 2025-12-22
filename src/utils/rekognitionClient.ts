import { RekognitionClient } from "@aws-sdk/client-rekognition";

/**
 * Trim env values safely
 */
function clean(value?: string) {
  return (value || "").trim();
}

/**
 * IMPORTANT:
 * - S3 can stay in us-east-2
 * - Rekognition MUST use us-east-1
 */
export const AWS_REKOGNITION_REGION =
  clean(process.env.AWS_REKOGNITION_REGION) || "us-east-1";

export const AWS_ACCESS_KEY_ID = clean(process.env.AWS_ACCESS_KEY_ID);
export const AWS_SECRET_ACCESS_KEY = clean(
  process.env.AWS_SECRET_ACCESS_KEY
);

export const COLLECTION_ID = clean(
  process.env.AWS_REKOGNITION_COLLECTION_ID
);

// --------------------------------------------------
// ENV VALIDATION (fail loud)
// --------------------------------------------------
if (!AWS_ACCESS_KEY_ID)
  throw new Error("❌ AWS_ACCESS_KEY_ID is missing");

if (!AWS_SECRET_ACCESS_KEY)
  throw new Error("❌ AWS_SECRET_ACCESS_KEY is missing");

if (!COLLECTION_ID)
  throw new Error(
    "❌ AWS_REKOGNITION_COLLECTION_ID is missing"
  );

console.log("🧠 Rekognition Region:", AWS_REKOGNITION_REGION);
console.log("🧠 Rekognition Collection:", COLLECTION_ID);

// --------------------------------------------------
// REKOGNITION CLIENT (CORRECT REGION)
// --------------------------------------------------
export const rekognitionClient = new RekognitionClient({
  region: AWS_REKOGNITION_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});
