// src/prisma.ts

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Optional: Log DB connection success
prisma.$connect()
  .then(() => console.log("✅ Prisma connected"))
  .catch((err) => console.error("❌ Prisma connection error:", err));
