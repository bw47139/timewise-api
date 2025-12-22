import AWS from "aws-sdk";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

export async function uploadToS3(buffer: Buffer, key: string) {
  const params = {
    Bucket: process.env.AWS_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf"
  };

  const res = await s3.upload(params).promise();
  return res.Location; // URL
}
