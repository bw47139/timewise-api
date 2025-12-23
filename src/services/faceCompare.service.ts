import {
  RekognitionClient,
  CompareFacesCommand,
  CompareFacesResponse,
} from "@aws-sdk/client-rekognition";

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
    // ------------------------------
    // Convert captured face to buffer
    // ------------------------------
    const capturedBytes = Buffer.from(
      capturedBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    // ------------------------------
    // Download employee reference photo
    // ------------------------------
    const employeePhotoBuffer = await fetch(employeePhotoUrl).then((r) =>
      r.arrayBuffer()
    );

    // ------------------------------
    // Build Rekognition request
    // ------------------------------
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: capturedBytes },
      TargetImage: { Bytes: Buffer.from(employeePhotoBuffer) },
      SimilarityThreshold: 85,
    });

    const response: CompareFacesResponse = await client.send(command);

    // ------------------------------
    // ⭐ FIX — Force strict boolean return
    // ------------------------------
    const hasMatch =
      Array.isArray(response.FaceMatches) &&
      response.FaceMatches.length > 0;

    return hasMatch; // always boolean
  } catch (error) {
    console.error("Face compare error:", error);
    return false;
  }
}
