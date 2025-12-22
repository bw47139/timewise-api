// src/modules/payrate/index.ts

import { Router } from "express";
import payRateRoutes from "./payrate.routes";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);
router.use("/", payRateRoutes);

export default router;
