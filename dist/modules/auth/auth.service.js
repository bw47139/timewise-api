"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
exports.authService = {
    async register(data) {
        const existing = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existing)
            throw new Error("Email already exists");
        const hashed = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashed,
                firstName: data.firstName,
                lastName: data.lastName,
            }
        });
        return user;
    },
    async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (!user)
            throw new Error("User not found");
        const isMatch = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isMatch)
            throw new Error("Invalid password");
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return {
            token,
            user,
        };
    }
};
