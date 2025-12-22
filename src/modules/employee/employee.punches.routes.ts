// UPDATED FULL FILE WITH PAY PERIOD LOCK ENFORCEMENT

import { Router, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { prisma } from "../../prisma";
import { isDateLockedForOrg } from "../payperiod/payperiod.routes"; // ⭐ uses pay period lock

const router = Router();

/* ---------------------------------------------------------
   Helper Functions
--------------------------------------------------------- */

function parseDateOnly(value?: string | string[]) {
  if (!value || typeof value !== "string") return null;
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return ok ? value : null;
}

function startOfDay(dateStr: string) {
  return new Date(dateStr + "T00:00:00.000Z");
}

function endOfDayExclusive(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function formatDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function upper(v: string | null | undefined) {
  return (v || "").toUpperCase();
}

function getSourceLabel(p: any): string {
  if (p.isSupervisorOverride) return "SUPERVISOR";
  if (p.isAutoLunch) return "AUTO-LUNCH";
  return "CLOCK";
}

function computeDailyBuckets(totalHours: number, cfg: any) {
  let reg = totalHours,
    ot = 0,
    dt = 0;

  if (!cfg.overtimeDailyEnabled) return { reg, ot, dt };

  const t1 = cfg.overtimeDailyThresholdHours ?? 8;
  const t2 = cfg.doubletimeDailyThresholdHours ?? 12;

  if (!cfg.doubletimeDailyEnabled) {
    if (totalHours > t1) {
      reg = t1;
      ot = totalHours - t1;
    }
    return { reg, ot, dt };
  }

  if (totalHours <= t1) {
    reg = totalHours;
  } else if (totalHours <= t2) {
    reg = t1;
    ot = totalHours - t1;
  } else {
    reg = t1;
    ot = t2 - t1;
    dt = totalHours - t2;
  }
  return { reg, ot, dt };
}

function getWeekStart(dateStr: string, weekStartDay: number) {
  const d = new Date(dateStr + "T00:00:00.000Z");
  const dow = d.getUTCDay();
  const diff = (dow - weekStartDay + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return formatDateOnly(d);
}

function buildDayPairs(punches: any[]) {
  const sorted = [...punches].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const pairs: any[] = [];
  let totalHours = 0;

  let i = 0;
  while (i < sorted.length) {
    const current = sorted[i];
    const type = upper(current.type);

    if (type === "IN") {
      let outPunch: any = null;

      for (let j = i + 1; j < sorted.length; j++) {
        const c = sorted[j];
        if (upper(c.type) === "IN") break;
        outPunch = c;
        break;
      }

      let hours = 0;
      if (outPunch) {
        const diffMs =
          outPunch.timestamp.getTime() - current.timestamp.getTime();
        if (diffMs > 0) hours = diffMs / (1000 * 60 * 60);
      }

      totalHours += hours;

      pairs.push({
        id: current.id,
        inTime: current.timestamp.toISOString(),
        outTime: outPunch ? outPunch.timestamp.toISOString() : null,
        source: getSourceLabel(current),
        locationName: current.location?.name || null,
      });

      i = outPunch ? sorted.indexOf(outPunch) + 1 : i + 1;
    } else {
      pairs.push({
        id: current.id,
        inTime: current.timestamp.toISOString(),
        outTime: null,
        source: getSourceLabel(current),
        locationName: current.location?.name || null,
      });
      i++;
    }
  }

  return { pairs, totalHours };
}

function findOutPunchForIn(punches: any[], inId: number) {
  const sorted = [...punches].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const idx = sorted.findIndex((p) => p.id === inId);
  if (idx === -1) return null;

  for (let i = idx + 1; i < sorted.length; i++) {
    const p = sorted[i];
    if (upper(p.type) === "IN") break;
    return p;
  }

  return null;
}

async function logPunchAudit(
  req: Request,
  employeeId: number,
  baseId: number,
  action: "CREATED" | "UPDATED" | "DELETED",
  beforeMeta: any,
  afterMeta: any
) {
  try {
    const user = (req as any).user || {};
    await prisma.auditLog.create({
      data: {
        userId: user.userId || null,
        userEmail: user.email || null,
        action,
        entityType: "PunchPair",
        entityId: `${employeeId}:${baseId}`,
        method: req.method,
        path: req.originalUrl,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          (req.socket as any)?.remoteAddress ||
          null,
        metadata: { before: beforeMeta || null, after: afterMeta || null },
      },
    });
  } catch (e) {
    console.error("Audit log write failed:", e);
  }
}

async function loadApprovalMap(employeeId: number, start: Date, end: Date) {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: "TimecardApproval",
      entityId: { startsWith: `${employeeId}:` },
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: "asc" },
  });

  const map: any = {};
  for (const log of logs) {
    const meta: any = log.metadata || {};
    const dateStr =
      meta.date || (log.entityId?.split(":")[1] ?? undefined);
    if (!dateStr) continue;

    map[dateStr] = {
      approvedByEmployee: !!meta.approvedByEmployee,
      approvedBySupervisor: !!meta.approvedBySupervisor,
    };
  }
  return map;
}

async function getEmployeeWithLocation(orgId: number, employeeId: number) {
  return prisma.employee.findFirst({
    where: { id: employeeId, organizationId: orgId, isDeleted: false },
    include: { location: true },
  });
}

/**
 * ---------------------------------------------------------
 * Pay-period lock helper for a whole range (Option 1)
 * Locked = true if ANY date in [startStr, endStr] is locked.
 * ---------------------------------------------------------
 */
async function isRangeLockedForOrg(
  organizationId: number,
  locationId: number | null,
  startStr: string,
  endStr: string
): Promise<boolean> {
  let cursor = startStr;
  while (cursor <= endStr) {
    const targetDate = new Date(`${cursor}T12:00:00`);
    const locked = await isDateLockedForOrg(
      organizationId,
      locationId,
      targetDate
    );
    if (locked) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

/* ---------------------------------------------------------
   GET /api/employee/:id/punches
--------------------------------------------------------- */

router.get("/:id/punches", verifyToken, async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employeeId = Number(req.params.id);
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(employeeId))
      return res.status(400).json({ error: "Invalid id" });

    const employee = await getEmployeeWithLocation(orgId, employeeId);
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const punches = await prisma.punch.findMany({
      where: { employeeId },
      orderBy: { timestamp: "desc" },
    });

    return res.json(punches);
  } catch (e) {
    console.error("GET /employee/:id/punches error:", e);
    return res.status(500).json({ error: "Failed to load punches" });
  }
});

/* ---------------------------------------------------------
   GET /api/employee/:id/timecard
--------------------------------------------------------- */

router.get("/:id/timecard", verifyToken, async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employeeId = Number(req.params.id);

    if (!orgId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(employeeId))
      return res.status(400).json({ error: "Invalid id" });

    const employee = await getEmployeeWithLocation(orgId, employeeId);
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const rawStart = parseDateOnly(req.query.startDate);
    const rawEnd = parseDateOnly(req.query.endDate);

    const today = formatDateOnly(new Date());
    const defaultStart = addDays(today, -13);

    const startStr = rawStart || defaultStart;
    const endStr = rawEnd || today;

    // 🔒 Pay-period locked if ANY date in the range is locked
    const locked = await isRangeLockedForOrg(
      employee.organizationId,
      employee.locationId,
      startStr,
      endStr
    );

    const start = startOfDay(startStr);
    const end = endOfDayExclusive(endStr);

    const punches = await prisma.punch.findMany({
      where: {
        employeeId,
        timestamp: { gte: start, lt: end },
      },
      include: { location: true },
      orderBy: { timestamp: "asc" },
    });

    const approvals = await loadApprovalMap(employeeId, start, end);

    const loc = employee.location;
    const cfg = {
      overtimeDailyEnabled: loc?.overtimeDailyEnabled ?? true,
      overtimeDailyThresholdHours: loc?.overtimeDailyThresholdHours ?? 8,
      doubletimeDailyEnabled: loc?.doubletimeDailyEnabled ?? false,
      doubletimeDailyThresholdHours: loc?.doubletimeDailyThresholdHours ?? 12,
      weekStartDay: loc?.weekStartDay ?? 1,
    };

    const dayMap: any = {};
    for (const p of punches) {
      const d = formatDateOnly(p.timestamp);
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(p);
    }

    const days: any[] = [];
    let cursor = startStr;
    while (cursor <= endStr) {
      const list = dayMap[cursor] || [];
      const { pairs, totalHours } = buildDayPairs(list);

      const b = computeDailyBuckets(totalHours, cfg);

      const approval = approvals[cursor] || {
        approvedByEmployee: false,
        approvedBySupervisor: false,
      };

      days.push({
        date: cursor,
        punches: pairs,
        regularHours: b.reg,
        overtimeHours: b.ot,
        doubletimeHours: b.dt,
        ptoHours: 0,
        approvedByEmployee: approval.approvedByEmployee,
        approvedBySupervisor: approval.approvedBySupervisor,
      });

      cursor = addDays(cursor, 1);
    }

    const weekMap: any = {};
    for (const d of days) {
      const key = getWeekStart(d.date, cfg.weekStartDay);
      if (!weekMap[key])
        weekMap[key] = {
          reg: 0,
          ot: 0,
          dt: 0,
          pto: 0,
          total: 0,
        };
      weekMap[key].reg += d.regularHours;
      weekMap[key].ot += d.overtimeHours;
      weekMap[key].dt += d.doubletimeHours;
      weekMap[key].pto += d.ptoHours;
      weekMap[key].total +=
        d.regularHours + d.overtimeHours + d.doubletimeHours + d.ptoHours;
    }

    const weeks = Object.entries(weekMap).map(([k, w]: any) => ({
      label: `Week of ${k}`,
      regularHours: w.reg,
      overtimeHours: w.ot,
      doubletimeHours: w.dt,
      ptoHours: w.pto,
      totalHours: w.total,
    }));

    let reg = 0,
      ot = 0,
      dt = 0,
      pto = 0;

    for (const d of days) {
      reg += d.regularHours;
      ot += d.overtimeHours;
      dt += d.doubletimeHours;
      pto += d.ptoHours;
    }

    return res.json({
      locked,
      days,
      summary: {
        totalRegularHours: reg,
        totalOvertimeHours: ot,
        totalDoubletimeHours: dt,
        totalPtoHours: pto,
        totalHours: reg + ot + dt + pto,
        weeks,
      },
    });
  } catch (e) {
    console.error("GET /employee/:id/timecard error:", e);
    return res.status(500).json({ error: "Failed to load timecard" });
  }
});

/* ---------------------------------------------------------
   POST /api/employee/:id/timecard/punch   (CREATE)
--------------------------------------------------------- */

router.post("/:id/timecard/punch", verifyToken, async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employeeId = Number(req.params.id);

    if (!orgId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(employeeId))
      return res.status(400).json({ error: "Invalid id" });

    const employee = await getEmployeeWithLocation(orgId, employeeId);
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const { date, inTime, outTime } = req.body || {};

    if (!date || !parseDateOnly(date))
      return res.status(400).json({ error: "Invalid date" });

    /* 🔐 PAY PERIOD LOCK ENFORCEMENT */
    const targetDate = new Date(`${date}T12:00:00`);
    const locked = await isDateLockedForOrg(
      employee.organizationId,
      employee.locationId,
      targetDate
    );
    if (locked) {
      return res.status(403).json({
        ok: false,
        error: "Pay period is approved/locked.",
        code: "PERIOD_LOCKED",
      });
    }

    if (!inTime) return res.status(400).json({ error: "inTime required" });

    const inTs = new Date(inTime);
    if (isNaN(inTs.getTime()))
      return res.status(400).json({ error: "Invalid inTime" });

    const inPunch = await prisma.punch.create({
      data: {
        employeeId,
        locationId: employee.locationId,
        type: "IN",
        timestamp: inTs,
        isSupervisorOverride: true,
      },
    });

    let outPunch = null;
    if (outTime) {
      const outTs = new Date(outTime);
      if (!isNaN(outTs.getTime())) {
        outPunch = await prisma.punch.create({
          data: {
            employeeId,
            locationId: employee.locationId,
            type: "OUT",
            timestamp: outTs,
            isSupervisorOverride: true,
          },
        });
      }
    }

    await logPunchAudit(req, employeeId, inPunch.id, "CREATED", null, {
      inTime: inPunch.timestamp,
      outTime: outPunch?.timestamp || null,
    });

    return res.status(201).json({ success: true, basePunchId: inPunch.id });
  } catch (e) {
    console.error("POST /employee/:id/timecard/punch error:", e);
    return res.status(500).json({ error: "Failed to create punch" });
  }
});

/* ---------------------------------------------------------
   PUT /api/employee/:id/timecard/punch/:punchId   (UPDATE)
--------------------------------------------------------- */

router.put("/:id/timecard/punch/:punchId", verifyToken, async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employeeId = Number(req.params.id);
    const punchId = Number(req.params.punchId);

    if (!orgId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(employeeId) || isNaN(punchId))
      return res.status(400).json({ error: "Invalid id" });

    const employee = await getEmployeeWithLocation(orgId, employeeId);
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const base = await prisma.punch.findFirst({
      where: { id: punchId, employeeId },
    });
    if (!base)
      return res.status(404).json({ error: "Punch not found" });

    const { date, inTime, outTime } = req.body || {};

    if (!date || !parseDateOnly(date))
      return res.status(400).json({ error: "Invalid date" });

    /* 🔐 PAY PERIOD LOCK ENFORCEMENT */
    const targetDate = new Date(`${date}T12:00:00`);
    const locked = await isDateLockedForOrg(
      employee.organizationId,
      employee.locationId,
      targetDate
    );
    if (locked) {
      return res.status(403).json({
        ok: false,
        error: "Pay period is approved/locked.",
        code: "PERIOD_LOCKED",
      });
    }

    if (!inTime)
      return res.status(400).json({ error: "inTime required" });

    const inTs = new Date(inTime);
    if (isNaN(inTs.getTime()))
      return res.status(400).json({ error: "Invalid inTime" });

    const dayStart = startOfDay(date);
    const dayEnd = endOfDayExclusive(date);

    const dayPunches = await prisma.punch.findMany({
      where: {
        employeeId,
        timestamp: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { timestamp: "asc" },
    });

    const outPunch = findOutPunchForIn(dayPunches, base.id);

    const beforeMeta = {
      inTime: base.timestamp,
      outTime: outPunch?.timestamp || null,
    };

    const updatedIn = await prisma.punch.update({
      where: { id: base.id },
      data: {
        timestamp: inTs,
        isSupervisorOverride: true,
      },
    });

    let updatedOut = outPunch || null;

    if (!outTime) {
      if (outPunch) {
        await prisma.punch.delete({ where: { id: outPunch.id } });
        updatedOut = null;
      }
    } else {
      const outTs = new Date(outTime);
      if (isNaN(outTs.getTime()))
        return res.status(400).json({ error: "Invalid outTime" });

      if (outPunch) {
        updatedOut = await prisma.punch.update({
          where: { id: outPunch.id },
          data: {
            timestamp: outTs,
            isSupervisorOverride: true,
          },
        });
      } else {
        updatedOut = await prisma.punch.create({
          data: {
            employeeId,
            locationId: employee.locationId,
            type: "OUT",
            timestamp: outTs,
            isSupervisorOverride: true,
          },
        });
      }
    }

    const afterMeta = {
      inTime: updatedIn.timestamp,
      outTime: updatedOut?.timestamp || null,
    };

    await logPunchAudit(
      req,
      employeeId,
      base.id,
      "UPDATED",
      beforeMeta,
      afterMeta
    );

    return res.json({ success: true });
  } catch (e) {
    console.error("PUT /employee/:id/timecard/punch error:", e);
    return res.status(500).json({ error: "Failed to update punch" });
  }
});

/* ---------------------------------------------------------
   DELETE /api/employee/:id/timecard/punch/:punchId   (DELETE)
--------------------------------------------------------- */

router.delete(
  "/:id/timecard/punch/:punchId",
  verifyToken,
  async (req, res) => {
    try {
      const orgId = (req as any).user?.organizationId;
      const employeeId = Number(req.params.id);
      const punchId = Number(req.params.punchId);

      if (!orgId) return res.status(401).json({ error: "Unauthorized" });
      if (isNaN(employeeId) || isNaN(punchId))
        return res.status(400).json({ error: "Invalid id" });

      const employee = await getEmployeeWithLocation(orgId, employeeId);
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });

      const base = await prisma.punch.findFirst({
        where: { id: punchId, employeeId },
      });
      if (!base)
        return res.status(404).json({ error: "Punch not found" });

      const dateStr = formatDateOnly(base.timestamp);

      /* 🔐 PAY PERIOD LOCK ENFORCEMENT */
      const targetDate = new Date(`${dateStr}T12:00:00`);
      const locked = await isDateLockedForOrg(
        employee.organizationId,
        employee.locationId,
        targetDate
      );
      if (locked) {
        return res.status(403).json({
          ok: false,
          error: "Pay period is approved/locked.",
          code: "PERIOD_LOCKED",
        });
      }

      const dayStart = startOfDay(dateStr);
      const dayEnd = endOfDayExclusive(dateStr);

      const dayPunches = await prisma.punch.findMany({
        where: {
          employeeId,
          timestamp: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { timestamp: "asc" },
      });

      const outPunch = findOutPunchForIn(dayPunches, base.id);

      const beforeMeta = {
        inTime: base.timestamp,
        outTime: outPunch?.timestamp || null,
      };

      await prisma.punch.delete({ where: { id: base.id } });
      if (outPunch) {
        await prisma.punch.delete({ where: { id: outPunch.id } });
      }

      await logPunchAudit(
        req,
        employeeId,
        base.id,
        "DELETED",
        beforeMeta,
        null
      );

      return res.json({ success: true });
    } catch (e) {
      console.error("DELETE /employee/:id/timecard/punch error:", e);
      return res.status(500).json({ error: "Failed to delete punch" });
    }
  }
);

/* ---------------------------------------------------------
   GET /api/employee/:id/timecard/punch/:punchId/audit
--------------------------------------------------------- */

router.get(
  "/:id/timecard/punch/:punchId/audit",
  verifyToken,
  async (req, res) => {
    try {
      const orgId = (req as any).user?.organizationId;
      const employeeId = Number(req.params.id);
      const punchId = Number(req.params.punchId);

      if (!orgId) return res.status(401).json({ error: "Unauthorized" });
      if (isNaN(employeeId) || isNaN(punchId))
        return res.status(400).json({ error: "Invalid id" });

      const employee = await getEmployeeWithLocation(orgId, employeeId);
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });

      const logs = await prisma.auditLog.findMany({
        where: {
          entityType: "PunchPair",
          entityId: `${employeeId}:${punchId}`,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(
        logs.map((log) => ({
          id: log.id,
          timestamp: log.createdAt,
          action: log.action,
          performedBy:
            log.userEmail ||
            (log.userId ? `User #${log.userId}` : "System"),
          details: log.metadata
            ? JSON.stringify(log.metadata, null, 2)
            : "",
        }))
      );
    } catch (e) {
      console.error("GET audit error:", e);
      return res.status(500).json({ error: "Failed to load audit log" });
    }
  }
);

/* ---------------------------------------------------------
   POST /api/employee/:id/timecard/approvals
--------------------------------------------------------- */

router.post(
  "/:id/timecard/approvals",
  verifyToken,
  async (req, res) => {
    try {
      const orgId = (req as any).user?.organizationId;
      const employeeId = Number(req.params.id);

      if (!orgId) return res.status(401).json({ error: "Unauthorized" });
      if (isNaN(employeeId))
        return res.status(400).json({ error: "Invalid id" });

      const employee = await getEmployeeWithLocation(orgId, employeeId);
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });

      const { days } = req.body || {};
      if (!Array.isArray(days))
        return res.status(400).json({ error: "Invalid payload" });

      const user = (req as any).user || {};

      for (const d of days) {
        if (!d?.date || !parseDateOnly(d.date)) continue;

        await prisma.auditLog.create({
          data: {
            userId: user.userId || null,
            userEmail: user.email || null,
            action: "APPROVAL_UPDATE",
            entityType: "TimecardApproval",
            entityId: `${employeeId}:${d.date}`,
            metadata: {
              date: d.date,
              approvedByEmployee: !!d.approvedByEmployee,
              approvedBySupervisor: !!d.approvedBySupervisor,
            },
          },
        });
      }

      return res.json({ success: true });
    } catch (e) {
      console.error("POST approvals error:", e);
      return res.status(500).json({ error: "Failed to save approvals" });
    }
  }
);

export default router;
