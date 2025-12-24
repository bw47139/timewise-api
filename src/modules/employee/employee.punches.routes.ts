// src/modules/employee/employee.punches.routes.ts
// UPDATED FULL FILE WITH PAY PERIOD LOCK ENFORCEMENT

import { Router, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { prisma } from "../../prisma";
import { isDateLockedForOrg } from "../payperiod/payperiod.routes";

const router = Router();

/* ---------------------------------------------------------
   Helper Functions
--------------------------------------------------------- */

function parseDateOnly(value?: string) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function startOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function endOfDayExclusive(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function formatDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateOnly(d);
}

function upper(v?: string | null) {
  return (v || "").toUpperCase();
}

function getSourceLabel(p: any) {
  if (p.isSupervisorOverride) return "SUPERVISOR";
  if (p.isAutoLunch) return "AUTO-LUNCH";
  return "CLOCK";
}

function getWeekStart(dateStr: string, weekStartDay: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const diff = (d.getUTCDay() - weekStartDay + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return formatDateOnly(d);
}

function computeDailyBuckets(total: number, cfg: any) {
  let reg = total,
    ot = 0,
    dt = 0;

  if (!cfg.overtimeDailyEnabled) return { reg, ot, dt };

  const t1 = cfg.overtimeDailyThresholdHours ?? 8;
  const t2 = cfg.doubletimeDailyThresholdHours ?? 12;

  if (!cfg.doubletimeDailyEnabled) {
    if (total > t1) {
      reg = t1;
      ot = total - t1;
    }
    return { reg, ot, dt };
  }

  if (total <= t1) reg = total;
  else if (total <= t2) {
    reg = t1;
    ot = total - t1;
  } else {
    reg = t1;
    ot = t2 - t1;
    dt = total - t2;
  }

  return { reg, ot, dt };
}

function buildDayPairs(punches: any[]) {
  const sorted = [...punches].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const pairs: any[] = [];
  let totalHours = 0;
  let i = 0;

  while (i < sorted.length) {
    const cur = sorted[i];

    if (upper(cur.type) === "IN") {
      const out =
        sorted[i + 1] && upper(sorted[i + 1].type) === "OUT"
          ? sorted[i + 1]
          : null;

      if (out) {
        totalHours +=
          (out.timestamp.getTime() - cur.timestamp.getTime()) /
          (1000 * 60 * 60);
      }

      pairs.push({
        id: cur.id,
        inTime: cur.timestamp.toISOString(),
        outTime: out?.timestamp.toISOString() ?? null,
        source: getSourceLabel(cur),
        locationName: cur.location?.name ?? null,
      });

      i += out ? 2 : 1;
    } else {
      i++;
    }
  }

  return { pairs, totalHours };
}

async function getEmployeeWithLocation(orgId: number, employeeId: number) {
  return prisma.employee.findFirst({
    where: { id: employeeId, organizationId: orgId, isDeleted: false },
    include: { location: true },
  });
}

/* ---------------------------------------------------------
   ROUTES
--------------------------------------------------------- */

router.get("/:id/punches", verifyToken, async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employeeId = Number(req.params.id);

    if (!orgId || isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const punches = await prisma.punch.findMany({
      where: { employeeId },
      orderBy: { timestamp: "desc" },
    });

    res.json(punches);
  } catch {
    res.status(500).json({ error: "Failed to load punches" });
  }
});

/* ---------------------------------------------------------
   GET TIME CARD
--------------------------------------------------------- */

router.get("/:id/timecard", verifyToken, async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employeeId = Number(req.params.id);

    if (!orgId || isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const employee = await getEmployeeWithLocation(orgId, employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ✅ SAFE query param narrowing (ParsedQs fix)
    const startDateParam =
      typeof req.query.startDate === "string"
        ? req.query.startDate
        : undefined;

    const endDateParam =
      typeof req.query.endDate === "string"
        ? req.query.endDate
        : undefined;

    const startStr =
      parseDateOnly(startDateParam) ??
      addDays(formatDateOnly(new Date()), -13);

    const endStr =
      parseDateOnly(endDateParam) ?? formatDateOnly(new Date());

    const locked = await isDateLockedForOrg(
      employee.organizationId,
      employee.locationId,
      new Date(`${startStr}T12:00:00Z`)
    );

    const punches = await prisma.punch.findMany({
      where: {
        employeeId,
        timestamp: {
          gte: startOfDay(startStr),
          lt: endOfDayExclusive(endStr),
        },
      },
      include: { location: true },
      orderBy: { timestamp: "asc" },
    });

    const cfg = {
      overtimeDailyEnabled: true,
      overtimeDailyThresholdHours: 8,
      doubletimeDailyEnabled: false,
      doubletimeDailyThresholdHours: 12,
      weekStartDay: employee.location?.weekStartDay ?? 1,
    };

    const dayMap: Record<string, any[]> = {};
    for (const p of punches) {
      const d = formatDateOnly(p.timestamp);
      (dayMap[d] ||= []).push(p);
    }

    const days: any[] = [];
    let cursor = startStr;

    while (cursor <= endStr) {
      const { pairs, totalHours } = buildDayPairs(dayMap[cursor] ?? []);
      const b = computeDailyBuckets(totalHours, cfg);

      days.push({
        date: cursor,
        punches: pairs,
        regularHours: b.reg,
        overtimeHours: b.ot,
        doubletimeHours: b.dt,
        ptoHours: 0,
      });

      cursor = addDays(cursor, 1);
    }

    res.json({ locked, days });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load timecard" });
  }
});

export default router;
