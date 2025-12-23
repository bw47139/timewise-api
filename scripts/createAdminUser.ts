import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "bw47139@gmail.com";
  const password = "Admin123!";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("⚠️ User already exists:", email);
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      firstName: "Pratik",
      lastName: "Patel",
      role: "ADMIN",
    },
  });

  console.log("✅ Created admin user:", { id: user.id, email: user.email });
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
