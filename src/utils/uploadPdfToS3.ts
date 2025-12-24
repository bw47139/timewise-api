import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client } from "./s3Client";

interface UploadPdfOptions {
  organizationId?: string | number;
  employeeId?: string | number;
  filename: string;
  buffer: Buffer;
  contentType?: string;
}

export async function uploadPdfToS3({
  organizationId,
  employeeId,
  filename,
  buffer,
  contentType,
}: UploadPdfOptions) {
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
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return public URL
  return {
    key,
    url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}
