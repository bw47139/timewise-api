import { PrismaClient } from "@prisma/client";

import { computePayPeriod } from "../payperiod/payPeriod.service";

import { OrganizationUpdateData } from "./organization.types";

const prisma = new PrismaClient();

/* ---------------------------------------------
   CREATE / READ / UPDATE / DELETE ORGANIZATION
--------------------------------------------- */

export function createOrganization(data: OrganizationUpdateData) {
  return prisma.organization.create({ data });
}

export function getOrganization(id: number) {
  return prisma.organization.findUnique({ where: { id } });
}

export function updateOrganization(id: number, data: OrganizationUpdateData) {
  return prisma.organization.update({
    where: { id },
    data,
  });
}

export function deleteOrganization(id: number) {
  return prisma.organization.delete({ where: { id } });
}

/* ---------------------------------------------
   NEW — LIST ALL ORGANIZATIONS
--------------------------------------------- */
export function getAllOrganizations() {
  return prisma.organization.findMany({
    orderBy: { id: "asc" },
  });
}

/* ---------------------------------------------
   NEW — LIST ALL LOCATIONS (WITH ORG INFO)
--------------------------------------------- */
export function getAllLocationsWithOrg() {
  return prisma.location.findMany({
    include: {
      organization: true,
    },
    orderBy: { id: "asc" },
  });
}

/* ---------------------------------------------
   AUTO-LUNCH SETTINGS
--------------------------------------------- */

export function getAutoLunchSettingsDB(id: number) {
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

export function updateAutoLunchSettingsDB(id: number, data: any) {
  return prisma.organization.update({
    where: { id },
    data,
  });
}

/* ---------------------------------------------
   PAY PERIOD CALCULATION
--------------------------------------------- */

export async function getPayPeriod(id: number, refDate: Date) {
  const org = await prisma.organization.findUnique({
    where: { id },
  });

  if (!org) return null;

  const range = computePayPeriod(org, refDate);
  return {
    ...range,
    payPeriodType: org.payPeriodType,
  };
}
