"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationSettingsService = void 0;
// src/modules/organization/organization.settings.service.ts
const prisma_1 = require("../../prisma");
exports.organizationSettingsService = {
    async getProfile(organizationId) {
        return prisma_1.prisma.organization.findUnique({
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
    async updateProfile(organizationId, data) {
        const allowed = {
            name: data.name,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zipcode: data.zipcode,
            logoUrl: data.logoUrl,
        };
        return prisma_1.prisma.organization.update({
            where: { id: organizationId },
            data: allowed,
        });
    },
};
