// src/modules/employee/employee.service.ts

import { PrismaClient } from "@prisma/client";

import { EmployeeCreateData, EmployeeUpdateData } from "./employee.types";

const prisma = new PrismaClient();

export async function createEmployee(data: EmployeeCreateData) {
  return prisma.employee.create({
    data,
  });
}

export async function listEmployees() {
  const employees = await prisma.employee.findMany({
    orderBy: { id: "asc" },
    include: {
      organization: true,
      location: true,
    },
  });

  return employees.map((emp) => ({
    id: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    pin: emp.pin,
    organizationId: emp.organizationId,
    locationId: emp.locationId,
    organizationName: emp.organization?.name,
    locationName: emp.location?.name,
  }));
}

export async function getEmployee(id: number) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      organization: true,
      location: true,
      punches: true,
    },
  });
}

export async function updateEmployee(id: number, data: EmployeeUpdateData) {
  return prisma.employee.update({
    where: { id },
    data,
  });
}

export async function deleteEmployee(id: number) {
  // Clean up punches for this employee first
  await prisma.punch.deleteMany({
    where: { employeeId: id },
  });

  await prisma.employee.delete({
    where: { id },
  });
}
