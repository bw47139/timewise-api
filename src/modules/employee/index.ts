import { Router, Request, Response } from "express";

import employeeRoutes from "./employee.routes";
import employeeStatusRoutes from "./employee.status.routes";
import employeePhotoRoutes from "./employee.photo.routes";
import employeePayrateRoutes from "./payrate.routes";
import employeeDocumentRoutes from "./employee.documents.routes";
import employeeNoteRoutes from "./employee.notes.routes";
import employeeActivityRoutes from "./employee.activity.routes";
import employeeTerminateRoutes from "./employee.terminate.routes";
import employeePunchesRoutes from "./employee.punches.routes"; // ✅ New from your version
import employeeEmergencyRoutes from "./employee.emergency.routes"; // ✅ NEW (Emergency Contacts)

/**
 * ------------------------------------------------------
 * Employee Module Entry Point
 * ------------------------------------------------------
 * Auto-mounted by autoRouter.ts at:
 *   /api/employee
 *
 * DO NOT prefix routes with /employee here
 * ------------------------------------------------------
 */

const router = Router();

/**
 * -----------------------------
 * Core Employee CRUD
 * -----------------------------
 * GET    /api/employee
 * POST   /api/employee
 * GET    /api/employee/:id
 */
router.use("/", employeeRoutes);

/**
 * -----------------------------
 * Status & Termination
 * -----------------------------
 */
router.use("/", employeeStatusRoutes);
router.use("/", employeeTerminateRoutes);

/**
 * -----------------------------
 * Photo Upload
 * -----------------------------
 */
router.use("/", employeePhotoRoutes);

/**
 * -----------------------------
 * Pay Rates
 * -----------------------------
 * GET    /api/employee/:id/payrates
 * POST   /api/employee/:id/payrates
 * PUT    /api/employee/payrates/:rateId
 * DELETE /api/employee/payrates/:rateId
 */
router.use("/", employeePayrateRoutes);

/**
 * -----------------------------
 * Notes & Documents
 * -----------------------------
 * GET/POST/DELETE Notes
 * GET/POST/DELETE Documents
 */
router.use("/", employeeNoteRoutes);
router.use("/", employeeDocumentRoutes);

/**
 * -----------------------------
 * Emergency Contacts  ⭐ NEW
 * -----------------------------
 * GET /api/employee/:id/emergency
 * POST /api/employee/:id/emergency
 * DELETE /api/employee/:id/emergency/:contactId
 */
router.use("/", employeeEmergencyRoutes);

/**
 * -----------------------------
 * Activity Log
 * -----------------------------
 * GET /api/employee/:id/activity
 */
router.use("/", employeeActivityRoutes);

/**
 * -----------------------------
 * Punch History
 * -----------------------------
 * GET /api/employee/:id/punches
 */
router.use("/", employeePunchesRoutes);

export default router;
