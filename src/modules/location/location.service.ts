// src/modules/location/location.service.ts
import { prisma } from "../../prisma";

/**
 * Location service
 *
 * All DB access related to Location lives here.
 * Every method is scoped by organizationId to keep multi-tenant safety.
 */
export const locationService = {
  /**
   * Get all locations for an organization
   */
  async getAll(organizationId: number) {
    return prisma.location.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  },

  /**
   * ⭐ Get a single location by ID
   */
  async getById(organizationId: number, id: number) {
    return prisma.location.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  },

  /**
   * Create a new location for an organization
   */
  async create(organizationId: number, name: string, timezone: string) {
    return prisma.location.create({
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
  async update(
    organizationId: number,
    id: number,
    data: { name?: string; timezone?: string }
  ) {
    // Update within organization scope
    await prisma.location.updateMany({
      where: {
        id,
        organizationId,
      },
      data,
    });

    // Return updated record
    return prisma.location.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  },

  /**
   * Delete a location for an organization
   */
  async remove(organizationId: number, id: number) {
    const result = await prisma.location.deleteMany({
      where: {
        id,
        organizationId,
      },
    });

    return { count: result.count };
  },
};
