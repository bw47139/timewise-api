// src/modules/organization/overtime.routes.ts
import { Router } from "express";

import { overtimeController } from "./overtime.controller";

const router = Router();

// GET /api/organization/overtime
router.get("/", overtimeController.getRules);

// PUT /api/organization/overtime
router.put("/", overtimeController.updateRules);

export default router;
