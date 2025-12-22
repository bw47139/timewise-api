// src/modules/organization/organization.settings.service.ts
import { prisma } from "../../prisma";

export const organizationSettingsService = {
  async getProfile(organizationId: number) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipcode: true,
        logoUrl: true,
      },
    });
  },

  async updateProfile(organizationId: number, data: any) {
    const allowed = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipcode: data.zipcode,
      logoUrl: data.logoUrl,
    };

    return prisma.organization.update({
      where: { id: organizationId },
      data: allowed,
    });
  },
};
