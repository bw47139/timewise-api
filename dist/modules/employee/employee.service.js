"use strict";
// src/modules/employee/employee.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmployee = createEmployee;
exports.listEmployees = listEmployees;
exports.getEmployee = getEmployee;
exports.updateEmployee = updateEmployee;
exports.deleteEmployee = deleteEmployee;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createEmployee(data) {
    return prisma.employee.create({
        data,
    });
}
async function listEmployees() {
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
async function getEmployee(id) {
    return prisma.employee.findUnique({
        where: { id },
        include: {
            organization: true,
            location: true,
            punches: true,
        },
    });
}
async function updateEmployee(id, data) {
    return prisma.employee.update({
        where: { id },
        data,
    });
}
async function deleteEmployee(id) {
    // Clean up punches for this employee first
    await prisma.punch.deleteMany({
        where: { employeeId: id },
    });
    await prisma.employee.delete({
        where: { id },
    });
}
