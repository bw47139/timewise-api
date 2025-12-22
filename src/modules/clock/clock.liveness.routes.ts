import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";

const prisma = new PrismaClient();
const router = Router();

/**
 * IMPORTANT:
 * Face Liveness is only supported in certain regions (ex: us-east-1, us-west-2).
 * Use AWS_REGION (or a dedicated AWS_REKOGNITION_REGION) that supports Face Liveness.
 */
const rekognition = new RekognitionClient({
  region: process.env.AWS_REKOGNITION_REGION || process.env.AWS_REGION || "us-east-1",
});

function getCollectionId() {
  // Your .env uses AWS_REKOGNITION_COLLECTION_ID
  return process.env.AWS_REKOGNITION_COLLECTION_ID || "timewise-employees";
}

/**
 * ------------------------------------------------------
 * POST /api/clock/liveness/session
 * Creates a one-time liveness session and returns sessionId
 * ------------------------------------------------------
 */
router.post("/liveness/session", async (_req: Request, res: Response) => {
  try {
    const cmd = new CreateFaceLivenessSessionCommand({
      Settings: {
        AuditImagesLimit: 2,
        // You can tune settings later; keep MVP stable.
      },
    });

    const out = await rekognition.send(cmd);

    if (!out.SessionId) {
      return res.status(500).json({ error: "Failed to create liveness session" });
    }

    return res.json({ sessionId: out.SessionId });
  } catch (err) {
    console.error("Create liveness session error:", err);
    return res.status(500).json({ error: "Create liveness session failed" });
  }
});

/**
 * ------------------------------------------------------
 * POST /api/clock/face/liveness
 * Body: { sessionId: string, locationId: number }
 *
 * Backend verifies liveness results + uses ReferenceImage to:
 * - Search face in collection
 * - Create punch IN/OUT
 * - Return standard punch response
 * ------------------------------------------------------
 */
router.post("/face/liveness", async (req: Request, res: Response) => {
  try {
    const { sessionId, locationId } = req.body as {
      sessionId?: string;
      locationId?: number;
    };

    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
    if (!locationId) return res.status(400).json({ error: "Missing locationId" });

    // 1) Get results (confidence 0-100)
    const results = await rekognition.send(
      new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId })
    );

    const confidence = results.Confidence ?? 0;

    // You can tune this threshold (90 is a common starting point)
    const MIN_CONFIDENCE = 90;

    if (confidence < MIN_CONFIDENCE) {
      return res.status(401).json({
        error: "Liveness check failed",
        confidence,
      });
    }

    const refBytes = results.ReferenceImage?.Bytes;
    if (!refBytes || refBytes.length === 0) {
      return res.status(500).json({ error: "No reference image returned from liveness" });
    }

    // 2) Search face from the liveness reference image
    const search = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: getCollectionId(),
        Image: { Bytes: refBytes },
        FaceMatchThreshold: 90,
        MaxFaces: 1,
      })
    );

    const match = search.FaceMatches?.[0];
    const externalId = match?.Face?.ExternalImageId;

    if (!externalId) {
      return res.status(404).json({ error: "No matching face found" });
    }

    const matchedEmployeeId = Number(externalId);

    // 3) Verify employee exists at this location
    const employee = await prisma.employee.findFirst({
      where: {
        id: matchedEmployeeId,
        locationId: Number(locationId),
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        locationId: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Matched face does not belong to an employee at this location",
      });
    }

    // 4) Determine punch type based on last punch
    const lastPunch = await prisma.punch.findFirst({
      where: { employeeId: employee.id },
      orderBy: { timestamp: "desc" },
      select: { type: true },
    });

    const punchType = !lastPunch || lastPunch.type === "OUT" ? "IN" : "OUT";

    // 5) Create punch
    const punch = await prisma.punch.create({
      data: {
        employeeId: employee.id,
        locationId: Number(locationId),
        type: punchType,
      },
      select: { id: true, type: true, timestamp: true },
    });

    return res.json({
      success: true,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      punchType: punch.type,
      punchedAt: punch.timestamp,
      livenessConfidence: confidence,
    });
  } catch (err) {
    console.error("Face liveness punch error:", err);
    return res.status(500).json({ error: "Face liveness punch server error" });
  }
});

export default router;
