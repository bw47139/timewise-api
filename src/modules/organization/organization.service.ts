import { PrismaClient, PayPeriodType } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------------------------
   TYPES — CREATE vs UPDATE (SCHEMA-TRUE)
--------------------------------------------- */

export type CreateOrganizationData = {
  name: string; // REQUIRED
  timezone?: string;

  phone?: string | null;

  // ✅ Address fields (schema-correct)
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type UpdateOrganizationData = Partial<CreateOrganizationData> & {
  // --------------------
  // Pay period config
  // --------------------
  payPeriodType?: PayPeriodType;
  weekStartDay?: number;
  biweeklyAnchorDate?: Date | null;
  cutoffTime?: string | null;

  // --------------------
  // Auto-lunch
  // --------------------
  autoLunchEnabled?: boolean;
  autoLunchMinutes?: number;
  autoLunchMinimumShift?: number;
  autoLunchDeductOnce?: boolean;
  autoLunchIgnoreIfBreak?: boolean;

  // --------------------
  // Overtime / Doubletime
  // --------------------
  overtimeDailyEnabled?: boolean;
  overtimeDailyThresholdHours?: number;

  overtimeWeeklyEnabled?: boolean;
  overtimeWeeklyThresholdHours?: number;

  doubleTimeEnabled?: boolean;
  doubletimeDailyThresholdHours?: number;

  // --------------------
  // PTO
  // --------------------
  ptoEnabled?: boolean;
  accrualRatePerPeriod?: number;
  maxPtoBalance?: number;
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

      // ✅ Address (schema-accurate)
      addressLine1: data.addressLine1 ?? null,
      addressLine2: data.addressLine2 ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      country: data.country ?? "USA",
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
  const updateData = stripUndefined({
    ...data,
  });

  return prisma.organization.update({
    where: { id },
    data: updateData,
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
   PAY PERIOD CONFIG (READ-ONLY)
--------------------------------------------- */

export function getPayPeriodConfig(id: number) {
  return prisma.organization.findUnique({
    where: { id },
    select: {
      payPeriodType: true,
      weekStartDay: true,
      biweeklyAnchorDate: true,
      cutoffTime: true,
    },
  });
}
