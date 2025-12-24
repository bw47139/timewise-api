"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "bw47139@gmail.com";
    const org = await prisma.organization.findFirst();
    if (!org) {
        throw new Error("❌ No organization found. Create one first.");
    }
    const user = await prisma.user.update({
        where: { email },
        data: {
            organizationId: org.id, // ✅ THIS is the key line
        },
    });
    console.log("✅ User assigned to organization:", {
        email: user.email,
        organizationId: org.id,
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
