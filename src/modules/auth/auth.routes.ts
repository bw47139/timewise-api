// timewise-api/src/modules/auth/auth.routes.ts

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/jwt";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();
const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * POST /api/auth/login
 * ------------------------------------------------------
 * Public login endpoint
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    console.log("🔐 Login attempt:", email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🧪 Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({
        error: "User is not assigned to an organization",
      });
    }

    // ✅ JWT PAYLOAD (authoritative)
    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ SET AUTH COOKIE (CANONICAL)
    res.cookie("tw_token", token, {
      httpOnly: true,   // 🔒 secure
      sameSite: "lax",  // ✅ localhost compatible
      secure: false,    // ❗ true in HTTPS production
      path: "/",        // 🔥 REQUIRED
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      error: "Login failed",
    });
  }
});

/**
 * ------------------------------------------------------
 * GET /api/auth/current
 * ------------------------------------------------------
 * Used by RequireAuth (CRITICAL)
 */
router.get(
  "/current",
  verifyToken,
  (req: Request, res: Response) => {
    return res.json({
      user: (req as any).user,
    });
  }
);

/**
 * ------------------------------------------------------
 * POST /api/auth/logout
 * ------------------------------------------------------
 * Clears auth cookie
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("tw_token", {
    path: "/",
  });

  return res.json({ success: true });
});

export default router;
