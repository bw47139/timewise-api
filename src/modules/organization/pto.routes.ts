// src/modules/organization/pto.routes.ts
import { Router, Request, Response } from "express";

import { ptoController } from "./pto.controller";

const router = Router();

// GET /api/organization/pto
router.get("/", ptoController.getSettings);

// PUT /api/organization/pto
router.put("/", ptoController.updateSettings);

export default router;
