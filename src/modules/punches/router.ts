import { Router, Request, Response } from "express";
import punchEmployeeRoutes from "./punch.employee.routes";
import punchRoutes from "./punch.routes";

const router = Router();

/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/punches
 */

router.use("/", punchRoutes);
router.use("/employee", punchEmployeeRoutes);

export default router;
