"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllLocationsHandler = listAllLocationsHandler;
exports.listLocationsForOrgHandler = listLocationsForOrgHandler;
exports.createLocationHandler = createLocationHandler;
exports.updateLocationHandler = updateLocationHandler;
exports.deleteLocationHandler = deleteLocationHandler;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/* ---------------------------------------------
   LIST ALL LOCATIONS
--------------------------------------------- */
async function listAllLocationsHandler(_req, res) {
    try {
        const locations = await prisma.location.findMany({
            include: { organization: true },
            orderBy: { id: "asc" },
        });
        res.json(locations);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to load locations" });
    }
}
/* ---------------------------------------------
   LIST LOCATIONS FOR A SPECIFIC ORG
--------------------------------------------- */
async function listLocationsForOrgHandler(req, res) {
    try {
        const orgId = Number(req.params.id);
        const locations = await prisma.location.findMany({
            where: { organizationId: orgId },
            orderBy: { id: "asc" },
        });
        res.json(locations);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to load organization locations" });
    }
}
/* ---------------------------------------------
   CREATE LOCATION
--------------------------------------------- */
async function createLocationHandler(req, res) {
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
    }
    catch (err) {
        res.status(500).json({ error: "Failed to create location" });
    }
}
/* ---------------------------------------------
   UPDATE LOCATION
--------------------------------------------- */
async function updateLocationHandler(req, res) {
    try {
        const locationId = Number(req.params.locationId);
        const updated = await prisma.location.update({
            where: { id: locationId },
            data: req.body,
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update location" });
    }
}
/* ---------------------------------------------
   DELETE LOCATION
--------------------------------------------- */
async function deleteLocationHandler(req, res) {
    try {
        const locationId = Number(req.params.locationId);
        await prisma.location.delete({
            where: { id: locationId },
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to delete location" });
    }
}
