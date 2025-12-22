import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const authService = {
  async register(data: any) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existing) throw new Error("Email already exists");

    const hashed = await bcrypt.hash(data.password, 10);

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

  async login(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new Error("Invalid password");

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    return {
      token,
      user,
    };
  }
};
