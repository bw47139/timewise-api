import { Router, Request, Response } from "express";

const router = Router();

/**
 * ------------------------------------------------------
 * GET /api/health
 * Public health check (NO AUTH)
 * ------------------------------------------------------
 */
router.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
