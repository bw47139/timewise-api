// src/modules/timecard/timecard.controller.ts

import { Request, Response } from "express";
import dayjs from "dayjs";

import { timecardService } from "./timecard.service";

/**
 * ------------------------------------------------------
 * GET /api/timecard/employee/:id
 *
 * Query:
 *   ?start=YYYY-MM-DD
 *   ?end=YYYY-MM-DD
 * ------------------------------------------------------
 */
export async function getEmployeeTimecard(
  req: Request,
  res: Response
) {
  try {
    const employeeId = Number(req.params.id);
    const { start, end } = req.query;

    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employeeId" });
    }

    if (!start || !end) {
      return res.status(400).json({
        error: "start and end query params are required (YYYY-MM-DD)",
      });
    }

    // --------------------------------------------------
    // Convert query params → ISO dates (STRICT)
    // --------------------------------------------------
    const startDate = dayjs(String(start)).startOf("day");
    const endDate = dayjs(String(end)).endOf("day");

    if (!startDate.isValid() || !endDate.isValid()) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // --------------------------------------------------
    // Delegate ALL logic to service
    // --------------------------------------------------
    const result = await timecardService.getSummary(
      employeeId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    return res.json(result);
  } catch (err) {
    console.error("Timecard controller error:", err);
    return res.status(500).json({
      error: "Failed to load timecard",
    });
  }
}
