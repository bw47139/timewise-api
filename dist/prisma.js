"use strict";
// src/prisma.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
// Optional: Log DB connection success
exports.prisma.$connect()
    .then(() => console.log("✅ Prisma connected"))
    .catch((err) => console.error("❌ Prisma connection error:", err));
