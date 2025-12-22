// src/modules/organization/router.ts
import { Router } from "express";

import { verifyToken } from "../../middleware/verifyToken";

import organizationRouter from "./organization.routes";
import organizationSettingsRouter from "./organization.settings.routes";
import payPeriodRouter from "./pay-period.routes";
import overtimeRouter from "./overtime.routes";
import ptoRouter from "./pto.routes";

export const organizationModuleRouter = Router();

// PUBLIC: first-time org creation (your existing behavior)
organizationModuleRouter.use("/api/organizations", organizationRouter);

// PROTECTED: org settings
organizationModuleRouter.use("/api/organization", verifyToken, organizationSettingsRouter);
organizationModuleRouter.use("/api/organization/pay-period", verifyToken, payPeriodRouter);
organizationModuleRouter.use("/api/organization/overtime", verifyToken, overtimeRouter);
organizationModuleRouter.use("/api/organization/pto", verifyToken, ptoRouter);
