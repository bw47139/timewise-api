"use strict";
// src/modules/organization/organization.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
exports.getOrganization = getOrganization;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
exports.getAllOrganizations = getAllOrganizations;
exports.getAllLocationsWithOrg = getAllLocationsWithOrg;
exports.getAutoLunchSettingsDB = getAutoLunchSettingsDB;
exports.updateAutoLunchSettingsDB = updateAutoLunchSettingsDB;
exports.getPayPeriodConfig = getPayPeriodConfig;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/* ---------------------------------------------
   INTERNAL HELPER
--------------------------------------------- */
function stripUndefined(obj) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            clean[key] = value;
        }
    }
    return clean;
}
/* ---------------------------------------------
   CRUD — ORGANIZATION
--------------------------------------------- */
function createOrganization(data) {
    return prisma.organization.create({
        data: {
            name: data.name,
            timezone: data.timezone ?? "America/New_York",
            phone: data.phone ?? null,
            address: data.address ?? null,
            city: data.city ?? null,
            state: data.state ?? null,
            zipcode: data.zipcode ?? null,
        },
    });
}
function getOrganization(id) {
    return prisma.organization.findUnique({
        where: { id },
    });
}
function updateOrganization(id, data) {
    const updateData = stripUndefined({
        ...data,
    });
    return prisma.organization.update({
        where: { id },
        data: updateData,
    });
}
function deleteOrganization(id) {
    return prisma.organization.delete({
        where: { id },
    });
}
/* ---------------------------------------------
   LISTING HELPERS
--------------------------------------------- */
function getAllOrganizations() {
    return prisma.organization.findMany({
        orderBy: { id: "asc" },
    });
}
function getAllLocationsWithOrg() {
    return prisma.location.findMany({
        include: { organization: true },
        orderBy: { id: "asc" },
    });
}
/* ---------------------------------------------
   AUTO-LUNCH SETTINGS
--------------------------------------------- */
function getAutoLunchSettingsDB(id) {
    return prisma.organization.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            autoLunchEnabled: true,
            autoLunchMinutes: true,
            autoLunchMinimumShift: true,
            autoLunchDeductOnce: true,
            autoLunchIgnoreIfBreak: true,
        },
    });
}
function updateAutoLunchSettingsDB(id, data) {
    return prisma.organization.update({
        where: { id },
        data: stripUndefined(data),
    });
}
/* ---------------------------------------------
   PAY PERIOD CONFIG (READ-ONLY, SCHEMA SAFE)
--------------------------------------------- */
function getPayPeriodConfig(id) {
    return prisma.organization.findUnique({
        where: { id },
        select: {
            payPeriodType: true,
            weekStartDay: true,
            biweeklyAnchorDate: true,
        },
    });
}
