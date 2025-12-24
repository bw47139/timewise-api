"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationService = void 0;
// src/modules/location/location.service.ts
const prisma_1 = require("../../prisma");
/**
 * Location service
 *
 * All DB access related to Location lives here.
 * Every method is scoped by organizationId to keep multi-tenant safety.
 */
exports.locationService = {
    /**
     * Get all locations for an organization
     */
    async getAll(organizationId) {
        return prisma_1.prisma.location.findMany({
            where: { organizationId },
            orderBy: { name: "asc" },
        });
    },
    /**
     * ⭐ Get a single location by ID
     */
    async getById(organizationId, id) {
        return prisma_1.prisma.location.findFirst({
            where: {
                id,
                organizationId,
            },
        });
    },
    /**
     * Create a new location for an organization
     */
    async create(organizationId, name, timezone) {
        return prisma_1.prisma.location.create({
            data: {
                name,
                timezone,
                organizationId,
            },
        });
    },
    /**
     * Update an existing location (name and/or timezone)
     */
    async update(organizationId, id, data) {
        // Update within organization scope
        await prisma_1.prisma.location.updateMany({
            where: {
                id,
                organizationId,
            },
            data,
        });
        // Return updated record
        return prisma_1.prisma.location.findFirst({
            where: {
                id,
                organizationId,
            },
        });
    },
    /**
     * Delete a location for an organization
     */
    async remove(organizationId, id) {
        const result = await prisma_1.prisma.location.deleteMany({
            where: {
                id,
                organizationId,
            },
        });
        return { count: result.count };
    },
};
