"use strict";
// src/modules/audit/audit.actions.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditActions = void 0;
/**
 * ------------------------------------------------------
 * Canonical Audit Actions
 * ------------------------------------------------------
 *
 * - Prevents typos (TypeScript enforced)
 * - Central source of truth
 * - Safe to evolve over time
 */
exports.AuditActions = {
    // Punches
    CREATE_PUNCH: "CREATE_PUNCH",
    UPDATE_PUNCH: "UPDATE_PUNCH",
    EDIT_PUNCH: "EDIT_PUNCH", // ✅ ADDED (fixes build errors)
    DELETE_PUNCH: "DELETE_PUNCH",
    // Employees
    CREATE_EMPLOYEE: "CREATE_EMPLOYEE",
    UPDATE_EMPLOYEE: "UPDATE_EMPLOYEE",
    TERMINATE_EMPLOYEE: "TERMINATE_EMPLOYEE",
    RESTORE_EMPLOYEE: "RESTORE_EMPLOYEE",
    // Pay Periods / Payroll
    LOCK_PAY_PERIOD: "LOCK_PAY_PERIOD",
    UNLOCK_PAY_PERIOD: "UNLOCK_PAY_PERIOD",
    APPROVE_PAYROLL: "APPROVE_PAYROLL",
    // Authentication / Security
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    PIN_PUNCH: "PIN_PUNCH",
    FACE_PUNCH: "FACE_PUNCH",
    // System / Admin
    SYSTEM_ACTION: "SYSTEM_ACTION",
};
