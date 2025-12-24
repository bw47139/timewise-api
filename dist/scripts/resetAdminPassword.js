"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "bw47139@gmail.com";
    const newPassword = "Admin123!";
    const hashed = await bcryptjs_1.default.hash(newPassword, 10);
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
