import { Router, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import payPeriodRoutes from "./payperiod.routes";

const router = Router();

/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/payperiod
 */

router.use(verifyToken);
router.use("/", payPeriodRoutes);

export default router;
