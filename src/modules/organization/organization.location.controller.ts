import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------------------------
   LIST ALL LOCATIONS
--------------------------------------------- */

export async function listAllLocationsHandler(_req: Request, res: Response) {
  try {
    const locations = await prisma.location.findMany({
      include: { organization: true },
      orderBy: { id: "asc" },
    });

    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: "Failed to load locations" });
  }
}

/* ---------------------------------------------
   LIST LOCATIONS FOR A SPECIFIC ORG
--------------------------------------------- */

export async function listLocationsForOrgHandler(req: Request, res: Response) {
  try {
    const orgId = Number(req.params.id);

    const locations = await prisma.location.findMany({
      where: { organizationId: orgId },
      orderBy: { id: "asc" },
    });

    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: "Failed to load organization locations" });
  }
}

/* ---------------------------------------------
   CREATE LOCATION
--------------------------------------------- */

export async function createLocationHandler(req: Request, res: Response) {
  try {
    const orgId = Number(req.params.id);
    const { name, timezone } = req.body;

    const location = await prisma.location.create({
      data: {
        organizationId: orgId,
        name,
        timezone,
      },
    });

    res.json(location);
  } catch (err) {
    res.status(500).json({ error: "Failed to create location" });
  }
}

/* ---------------------------------------------
   UPDATE LOCATION
--------------------------------------------- */

export async function updateLocationHandler(req: Request, res: Response) {
  try {
    const locationId = Number(req.params.locationId);

    const updated = await prisma.location.update({
      where: { id: locationId },
      data: req.body,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update location" });
  }
}

/* ---------------------------------------------
   DELETE LOCATION
--------------------------------------------- */

export async function deleteLocationHandler(req: Request, res: Response) {
  try {
    const locationId = Number(req.params.locationId);

    await prisma.location.delete({
      where: { id: locationId },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete location" });
  }
}
