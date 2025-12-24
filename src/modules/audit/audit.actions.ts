// src/modules/audit/audit.actions.ts

/**
 * ------------------------------------------------------
 * Canonical Audit Actions
 * ------------------------------------------------------
 *
 * - Prevents typos (TypeScript enforced)
 * - Central source of truth
 * - Safe to evolve over time
 */

export const AuditActions = {
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
} as const;

/**
 * Union type of all valid audit actions
 */
export type AuditAction =
  (typeof AuditActions)[keyof typeof AuditActions];
