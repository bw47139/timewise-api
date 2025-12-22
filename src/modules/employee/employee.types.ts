// src/modules/employee/employee.types.ts

export interface EmployeeCreateData {
  organizationId: number;
  locationId: number;
  firstName: string;
  lastName: string;
  pin: string;
}

export interface EmployeeUpdateData {
  organizationId?: number;
  locationId?: number;
  firstName?: string;
  lastName?: string;
  pin?: string;
}
