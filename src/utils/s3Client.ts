import { S3Client } from "@aws-sdk/client-s3";

function clean(value?: string) {
  return (value || "").trim();
}

const region = clean(process.env.AWS_REGION) || "us-east-2";
const accessKeyId = clean(process.env.AWS_ACCESS_KEY_ID);
const secretAccessKey = clean(process.env.AWS_SECRET_ACCESS_KEY);

if (!region) console.error("❌ AWS_REGION missing");
if (!accessKeyId) console.error("❌ AWS_ACCESS_KEY_ID missing");
if (!secretAccessKey) console.error("❌ AWS_SECRET_ACCESS_KEY missing");

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
