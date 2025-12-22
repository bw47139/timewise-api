// src/modules/organization/organization.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ======================================================
   CREATE ORGANIZATION
====================================================== */
export const createOrganizationHandler = async (req: Request, res: Response) => {
  try {
    const { name, timezone } = req.body;

    if (!name || !timezone) {
      return res.status(400).json({ error: "Name and timezone are required" });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        timezone,
      },
    });

    return res.json(organization);

  } catch (error: any) {
    console.error("Create Organization Error:", error);
    return res.status(500).json({ error: "Failed to create organization", details: error.message });
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

    if (!org) return res.status(404).json({ error: "Organization not found" });

    return res.json(org);
  } catch (error) {
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
    const { name, timezone } = req.body;

    const org = await prisma.organization.update({
      where: { id },
      data: {
        name,
        timezone,
      },
    });

    return res.json(org);
  } catch (error) {
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
  } catch (error) {
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
      },
    });

    if (!org) return res.status(404).json({ error: "Organization not found" });

    return res.json(org);
  } catch (error) {
    console.error("Get Auto-Lunch Error:", error);
    return res.status(500).json({ error: "Failed to load auto-lunch settings" });
  }
};

export const updateAutoLunchSettings = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { autoLunchEnabled, autoLunchMinutes, autoLunchMinimumShift } = req.body;

    const settings = await prisma.organization.update({
      where: { id },
      data: {
        autoLunchEnabled,
        autoLunchMinutes,
        autoLunchMinimumShift,
      },
    });

    return res.json(settings);
  } catch (error) {
    console.error("Update Auto-Lunch Error:", error);
    return res.status(500).json({ error: "Failed to update auto-lunch settings" });
  }
};

/* ======================================================
   PAY PERIOD SETTINGS
====================================================== */
export const getPayPeriodHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const org = await prisma.organization.findUnique({
      where: { id },
      select: {
        payPeriodType: true,
        payPeriodAnchorDate: true,
      },
    });

    if (!org) return res.status(404).json({ error: "Organization not found" });

    return res.json(org);
  } catch (error) {
    console.error("Get Pay Period Error:", error);
    return res.status(500).json({ error: "Failed to load pay period settings" });
  }
};
