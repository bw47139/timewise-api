// scripts/createAdmin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const plainPassword = "yourpassword";

  // 1) Ensure we have at least one Organization
  let org = await prisma.organization.findFirst();

  if (!org) {
    console.log("No organization found. Creating a default one...");
    org = await prisma.organization.create({
      data: {
        name: "Default Organization",
      },
    });
  }

  console.log("Using organizationId:", org.id);

  // 2) Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("User already exists with this email:", email);
    console.log("id:", existing.id, "organizationId:", existing.organizationId);
    return;
  }

  // 3) Hash password
  const hashed = await bcrypt.hash(plainPassword, 10);

  // 4) Create ADMIN user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  console.log("✅ Admin user created:");
  console.log("  email:", email);
  console.log("  password:", plainPassword);
  console.log("  id:", user.id);
  console.log("  organizationId:", user.organizationId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
