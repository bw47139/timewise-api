// src/modules/organization/organization.service.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------------------------
   TYPES — CREATE vs UPDATE (SCHEMA-TRUE)
--------------------------------------------- */

export type CreateOrganizationData = {
  name: string; // REQUIRED
  timezone?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
};

export type UpdateOrganizationData = Partial<CreateOrganizationData> & {
  // Pay period CONFIG ONLY (stored fields only)
  payPeriodType?: string;
  weekStartDay?: number;
  biweeklyAnchorDate?: Date | null;

  // Locking
  payPeriodLockEnabled?: boolean;
  lockAfterDays?: number;

  // Overtime / Doubletime
  overtimeDailyThresholdHours?: number;
  overtimeWeeklyThresholdHours?: number;
  doubletimeDailyThresholdHours?: number;

  // Auto-lunch
  autoLunchEnabled?: boolean;
  autoLunchMinutes?: number;
  autoLunchMinimumShift?: number;
  autoLunchDeductOnce?: boolean;
  autoLunchIgnoreIfBreak?: boolean;

  // PTO
  ptoAccrualEnabled?: boolean;
  ptoAccrualRateHoursPerHourWorked?: number;
  ptoAccrualMaxBalanceHours?: number;
  carryoverEnabled?: boolean;
  carryoverLimit?: number;
};

/* ---------------------------------------------
   INTERNAL HELPER
--------------------------------------------- */

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (clean as any)[key] = value;
    }
  }
  return clean;
}

/* ---------------------------------------------
   CRUD — ORGANIZATION
--------------------------------------------- */

export function createOrganization(data: CreateOrganizationData) {
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

export function getOrganization(id: number) {
  return prisma.organization.findUnique({
    where: { id },
  });
}

export function updateOrganization(
  id: number,
  data: UpdateOrganizationData
) {
  return prisma.organization.update({
    where: { id },
    data: stripUndefined(data),
  });
}

export function deleteOrganization(id: number) {
  return prisma.organization.delete({
    where: { id },
  });
}

/* ---------------------------------------------
   LISTING HELPERS
--------------------------------------------- */

export function getAllOrganizations() {
  return prisma.organization.findMany({
    orderBy: { id: "asc" },
  });
}

export function getAllLocationsWithOrg() {
  return prisma.location.findMany({
    include: { organization: true },
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

export function updateAutoLunchSettingsDB(
  id: number,
  data: Pick<
    UpdateOrganizationData,
    | "autoLunchEnabled"
    | "autoLunchMinutes"
    | "autoLunchMinimumShift"
    | "autoLunchDeductOnce"
    | "autoLunchIgnoreIfBreak"
  >
) {
  return prisma.organization.update({
    where: { id },
    data: stripUndefined(data),
  });
}

/* ---------------------------------------------
   PAY PERIOD CONFIG (READ-ONLY, SCHEMA SAFE)
--------------------------------------------- */

export function getPayPeriodConfig(id: number) {
  return prisma.organization.findUnique({
    where: { id },
    select: {
      payPeriodType: true,
      weekStartDay: true,
      biweeklyAnchorDate: true,
    },
  });
}
