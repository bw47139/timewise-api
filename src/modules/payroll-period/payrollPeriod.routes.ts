import { Router, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import {
  listPayrollPeriods,
  generateBiWeekly,
  supervisorApprove,
  adminLock,
  unlockPeriod,
} from "./payrollPeriod.service";

const router = Router();

/** GET /api/payroll-period */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;
    const locationId = Number(req.query.locationId);

    const periods = await listPayrollPeriods(organizationId, locationId);
    return res.json(periods);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load payroll periods" });
  }
});

/** POST /api/payroll-period/generate */
router.post("/generate", verifyToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user as any;
    const { locationId, anchorDate } = req.body;

    const created = await generateBiWeekly(
      organizationId,
      Number(locationId),
      new Date(anchorDate)
    );

    return res.json({ ok: true, periods: created });
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate periods" });
  }
});

/** POST /api/payroll-period/:id/supervisor-approve */
router.post("/:id/supervisor-approve", verifyToken, async (req: Request, res: Response) => {
  try {
    const periodId = Number(req.params.id);
    const user = req.user as any;

    const period = await supervisorApprove(periodId, user.id);
    return res.json({ ok: true, period });
  } catch (err) {
    return res.status(500).json({ error: "Failed supervisor approval" });
  }
});

/** POST /api/payroll-period/:id/admin-lock */
router.post("/:id/admin-lock", verifyToken, async (req: Request, res: Response) => {
  try {
    const periodId = Number(req.params.id);
    const user = req.user as any;

    const period = await adminLock(periodId, user.id);
    return res.json({ ok: true, period });
  } catch (err) {
    return res.status(500).json({ error: "Failed admin lock" });
  }
});

/** POST /api/payroll-period/:id/unlock */
router.post("/:id/unlock", verifyToken, async (req: Request, res: Response) => {
  try {
    const periodId = Number(req.params.id);

    const period = await unlockPeriod(periodId);
    return res.json({ ok: true, period });
  } catch (err) {
    return res.status(500).json({ error: "Failed to unlock period" });
  }
});

export default router;
