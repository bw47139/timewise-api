import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "bw47139@gmail.com";
  const newPassword = "Admin123!";

  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
    },
  });

  console.log("✅ Password reset successful");
  console.log("Email:", user.email);
  console.log("New Password:", newPassword);
}

main()
  .catch((err) => {
    console.error("❌ Reset failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
