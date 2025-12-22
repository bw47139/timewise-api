import path from "path";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client } from "../utils/s3Client";

interface UploadPdfOptions {
  organizationId: string | number;
  employeeId: string | number;
  filename: string;
  buffer: Buffer;
}

export async function uploadPdfToS3({
  organizationId,
  employeeId,
  filename,
  buffer,
}: UploadPdfOptions) {
  const bucket = process.env.AWS_S3_BUCKET!;
  const key = `timesheets/${organizationId}/${employeeId}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
    ACL: "private",  // keep secure
  });

  await s3Client.send(command);

  return {
    key,
    url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}
