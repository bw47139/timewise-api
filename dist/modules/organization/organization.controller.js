"use strict";
// src/modules/organization/organization.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayPeriodHandler = exports.updateAutoLunchSettings = exports.getAutoLunchSettings = exports.deleteOrganizationHandler = exports.updateOrganizationHandler = exports.getOrganizationHandler = exports.createOrganizationHandler = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Helper — strip undefined values
 */
function stripUndefined(obj) {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined)
            clean[k] = v;
    }
    return clean;
}
/* ======================================================
   CREATE ORGANIZATION
====================================================== */
const createOrganizationHandler = async (req, res) => {
    try {
        const { name, timezone } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Organization name is required" });
        }
        const organization = await prisma.organization.create({
            data: {
                name,
                timezone: timezone ?? "America/New_York",
            },
        });
        return res.json(organization);
    }
    catch (error) {
        console.error("Create Organization Error:", error);
        return res.status(500).json({
            error: "Failed to create organization",
            details: error?.message,
        });
    }
};
exports.createOrganizationHandler = createOrganizationHandler;
/* ======================================================
   GET ORGANIZATION
====================================================== */
const getOrganizationHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const org = await prisma.organization.findUnique({
            where: { id },
        });
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        return res.json(org);
    }
    catch (error) {
        console.error("Get Organization Error:", error);
        return res.status(500).json({ error: "Failed to load organization" });
    }
};
exports.getOrganizationHandler = getOrganizationHandler;
/* ======================================================
   UPDATE ORGANIZATION
====================================================== */
const updateOrganizationHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, timezone, payPeriodType, weekStartDay, biweeklyAnchorDate, } = req.body;
        const data = stripUndefined({
            name,
            timezone,
            payPeriodType,
            weekStartDay,
            biweeklyAnchorDate: biweeklyAnchorDate === undefined
                ? undefined
                : biweeklyAnchorDate === null
                    ? null
                    : new Date(biweeklyAnchorDate),
        });
        const org = await prisma.organization.update({
            where: { id },
            data,
        });
        return res.json(org);
    }
    catch (error) {
        console.error("Update Organization Error:", error);
        return res.status(500).json({ error: "Failed to update organization" });
    }
};
exports.updateOrganizationHandler = updateOrganizationHandler;
/* ======================================================
   DELETE ORGANIZATION
====================================================== */
const deleteOrganizationHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.organization.delete({
            where: { id },
        });
        return res.json({ message: "Organization deleted" });
    }
    catch (error) {
        console.error("Delete Organization Error:", error);
        return res.status(500).json({ error: "Failed to delete organization" });
    }
};
exports.deleteOrganizationHandler = deleteOrganizationHandler;
/* ======================================================
   AUTO-LUNCH SETTINGS
====================================================== */
const getAutoLunchSettings = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const org = await prisma.organization.findUnique({
            where: { id },
            select: {
                autoLunchEnabled: true,
                autoLunchMinutes: true,
                autoLunchMinimumShift: true,
                autoLunchDeductOnce: true,
                autoLunchIgnoreIfBreak: true,
            },
        });
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        return res.json(org);
    }
    catch (error) {
        console.error("Get Auto-Lunch Error:", error);
        return res.status(500).json({ error: "Failed to load auto-lunch settings" });
    }
};
exports.getAutoLunchSettings = getAutoLunchSettings;
const updateAutoLunchSettings = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { autoLunchEnabled, autoLunchMinutes, autoLunchMinimumShift, autoLunchDeductOnce, autoLunchIgnoreIfBreak, } = req.body;
        const settings = await prisma.organization.update({
            where: { id },
            data: stripUndefined({
                autoLunchEnabled,
                autoLunchMinutes,
                autoLunchMinimumShift,
                autoLunchDeductOnce,
                autoLunchIgnoreIfBreak,
            }),
        });
        return res.json(settings);
    }
    catch (error) {
        console.error("Update Auto-Lunch Error:", error);
        return res.status(500).json({ error: "Failed to update auto-lunch settings" });
    }
};
exports.updateAutoLunchSettings = updateAutoLunchSettings;
/* ======================================================
   PAY PERIOD SETTINGS (READ ONLY)
====================================================== */
const getPayPeriodHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const org = await prisma.organization.findUnique({
            where: { id },
            select: {
                payPeriodType: true,
                weekStartDay: true,
                biweeklyAnchorDate: true,
            },
        });
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        return res.json(org);
    }
    catch (error) {
        console.error("Get Pay Period Error:", error);
        return res.status(500).json({ error: "Failed to load pay period settings" });
    }
};
exports.getPayPeriodHandler = getPayPeriodHandler;
