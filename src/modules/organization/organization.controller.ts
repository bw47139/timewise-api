// src/modules/organization/organization.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Helper — strip undefined values
 */
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

/* ======================================================
   CREATE ORGANIZATION
====================================================== */
export const createOrganizationHandler = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error("Create Organization Error:", error);
    return res.status(500).json({
      error: "Failed to create organization",
      details: error?.message,
    });
  }
};

/* ======================================================
   GET ORGANIZATION
====================================================== */
export const getOrganizationHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const org = await prisma.organization.findUnique({
      where: { id },
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(org);
  } catch (error: any) {
    console.error("Get Organization Error:", error);
    return res.status(500).json({ error: "Failed to load organization" });
  }
};

/* ======================================================
   UPDATE ORGANIZATION
====================================================== */
export const updateOrganizationHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      timezone,
      payPeriodType,
      weekStartDay,
      biweeklyAnchorDate,
    } = req.body;

    const data = stripUndefined({
      name,
      timezone,
      payPeriodType,
      weekStartDay,
      biweeklyAnchorDate:
        biweeklyAnchorDate === undefined
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
  } catch (error: any) {
    console.error("Update Organization Error:", error);
    return res.status(500).json({ error: "Failed to update organization" });
  }
};

/* ======================================================
   DELETE ORGANIZATION
====================================================== */
export const deleteOrganizationHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.organization.delete({
      where: { id },
    });

    return res.json({ message: "Organization deleted" });
  } catch (error: any) {
    console.error("Delete Organization Error:", error);
    return res.status(500).json({ error: "Failed to delete organization" });
  }
};

/* ======================================================
   AUTO-LUNCH SETTINGS
====================================================== */
export const getAutoLunchSettings = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error("Get Auto-Lunch Error:", error);
    return res.status(500).json({ error: "Failed to load auto-lunch settings" });
  }
};

export const updateAutoLunchSettings = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const {
      autoLunchEnabled,
      autoLunchMinutes,
      autoLunchMinimumShift,
      autoLunchDeductOnce,
      autoLunchIgnoreIfBreak,
    } = req.body;

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
  } catch (error: any) {
    console.error("Update Auto-Lunch Error:", error);
    return res.status(500).json({ error: "Failed to update auto-lunch settings" });
  }
};

/* ======================================================
   PAY PERIOD SETTINGS (READ ONLY)
====================================================== */
export const getPayPeriodHandler = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error("Get Pay Period Error:", error);
    return res.status(500).json({ error: "Failed to load pay period settings" });
  }
};
