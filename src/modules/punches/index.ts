import { Router } from "express";
import punchesRouter from "./router";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

/**
 * AUTO-LOADED by autoRouter
 * Base path: /api/punches
 */

router.use(verifyToken);
router.use("/", punchesRouter);

export default router;
