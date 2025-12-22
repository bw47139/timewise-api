import { PrismaClient, PayrollPeriodStatus } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

/** List payroll periods */
export async function listPayrollPeriods(organizationId: number, locationId: number) {
  return prisma.payrollPeriod.findMany({
    where: { organizationId, locationId },
    orderBy: { startDate: "desc" },
  });
}

/** Generate bi-weekly (14-day) periods */
export async function generateBiWeekly(
  organizationId: number,
  locationId: number,
  anchorDate: Date,
  count = 12
) {
  const periods = [];
  let start = dayjs(anchorDate);

  for (let i = 0; i < count; i++) {
    const end = start.add(13, "day"); // ← 14 days total

    const period = await prisma.payrollPeriod.upsert({
      where: {
        organizationId_locationId_startDate_endDate: {
          organizationId,
          locationId,
          startDate: start.toDate(),
          endDate: end.toDate(),
        },
      },
      update: {},
      create: {
        organizationId,
        locationId,
        startDate: start.toDate(),
        endDate: end.toDate(),
        status: PayrollPeriodStatus.OPEN,
      },
    });

    periods.push(period);
    start = end.add(1, "day");
  }

  return periods;
}

/** Supervisor approval */
export async function supervisorApprove(periodId: number, userId: number) {
  return prisma.payrollPeriod.update({
    where: { id: periodId },
    data: {
      approvedByUserId: userId,
      approvedAt: new Date(),
      status: PayrollPeriodStatus.APPROVED,
    },
  });
}

/** Admin lock */
export async function adminLock(periodId: number, userId: number) {
  return prisma.payrollPeriod.update({
    where: { id: periodId },
    data: {
      lockedByUserId: userId,
      lockedAt: new Date(),
      status: PayrollPeriodStatus.LOCKED,
    },
  });
}

/** Unlock period */
export async function unlockPeriod(periodId: number) {
  return prisma.payrollPeriod.update({
    where: { id: periodId },
    data: {
      status: PayrollPeriodStatus.OPEN,
      approvedAt: null,
      approvedByUserId: null,
      lockedAt: null,
      lockedByUserId: null,
    },
  });
}
