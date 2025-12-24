"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationController = void 0;
const location_service_1 = require("./location.service");
exports.locationController = {
    /**
     * GET ALL LOCATIONS
     */
    async getAll(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const locations = await location_service_1.locationService.getAll(orgId);
            return res.json(locations);
        }
        catch (err) {
            console.error("location getAll error:", err);
            return res.status(500).json({ error: "Failed to load locations" });
        }
    },
    /**
     * ⭐ GET A SINGLE LOCATION BY ID
     */
    async getById(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const id = Number(req.params.id);
            const location = await location_service_1.locationService.getById(orgId, id);
            if (!location) {
                return res.status(404).json({ error: "Location not found" });
            }
            return res.json(location);
        }
        catch (err) {
            console.error("location getById error:", err);
            return res.status(500).json({ error: "Failed to load location" });
        }
    },
    /**
     * CREATE LOCATION
     */
    async create(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const { name, timezone } = req.body;
            if (!name || !timezone) {
                return res.status(400).json({ error: "name and timezone are required" });
            }
            const created = await location_service_1.locationService.create(orgId, name, timezone);
            return res.json(created);
        }
        catch (err) {
            console.error("location create error:", err);
            return res.status(500).json({ error: "Failed to create location" });
        }
    },
    /**
     * UPDATE LOCATION
     */
    async update(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const id = Number(req.params.id);
            const { name, timezone } = req.body;
            const updated = await location_service_1.locationService.update(orgId, id, { name, timezone });
            if (!updated) {
                return res.status(404).json({ error: "Location not found" });
            }
            return res.json(updated);
        }
        catch (err) {
            console.error("location update error:", err);
            return res.status(500).json({ error: "Failed to update location" });
        }
    },
    /**
     * DELETE LOCATION
     */
    async remove(req, res) {
        try {
            const orgId = req.user?.organizationId;
            if (!orgId)
                return res.status(401).json({ error: "Unauthorized" });
            const id = Number(req.params.id);
            const result = await location_service_1.locationService.remove(orgId, id);
            if (result.count === 0) {
                return res.status(404).json({ error: "Location not found" });
            }
            return res.json({ success: true });
        }
        catch (err) {
            console.error("location delete error:", err);
            return res.status(500).json({ error: "Failed to delete location" });
        }
    },
};
