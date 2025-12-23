import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "TimeWise",
      timezone: "America/New_York",
    },
  });

  console.log("✅ Organization created:", {
    id: org.id,
    name: org.name,
  });
}

main()
  .catch((e) => {
    console.error("❌ Failed to create org:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
