import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export async function compareFaces(
  capturedBase64: string,
  employeePhotoUrl: string
): Promise<boolean> {
  try {
    const capturedBytes = Buffer.from(
      capturedBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const employeePhotoBuffer = await fetch(employeePhotoUrl).then((r) =>
      r.arrayBuffer()
    );

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: capturedBytes },
      TargetImage: { Bytes: Buffer.from(employeePhotoBuffer) },
      SimilarityThreshold: 85,
    });

    const response = await client.send(command);

    return response.FaceMatches && response.FaceMatches.length > 0;
  } catch (error) {
    console.error("Face compare error:", error);
    return false;
  }
}
