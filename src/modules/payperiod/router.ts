import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import payPeriodRoutes from "./payPeriod.routes";

const router = Router();

/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/payperiod
 */

router.use(verifyToken);
router.use("/", payPeriodRoutes);

export default router;
