// src/modules/timecard/timecard.controller.ts

import { Request, Response } from "express";

import { getTimecardForRange } from "./timecard.service";

export async function getTimecardHandler(req: Request, res: Response) {
  try {
    // We support BOTH:
    // - /api/timecards/1?start=YYYY-MM-DD&end=YYYY-MM-DD  (params)
    // - /api/timecards?employeeId=1&start=YYYY-MM-DD&end=YYYY-MM-DD (query)
    const employeeId = Number(
      req.params.employeeId || req.query.employeeId
    );
    const start = req.query.start as string;
    const end = req.query.end as string;

    if (!employeeId || !start || !end) {
      return res.status(400).json({
        error: "employeeId, start, and end are required",
      });
    }

    const result = await getTimecardForRange(employeeId, start, end);

    res.json(result);
  } catch (err) {
    console.error("Timecard error:", err);
    res.status(500).json({ error: "Failed to compute timecard" });
  }
}
