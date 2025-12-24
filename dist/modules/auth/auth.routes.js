"use strict";
// timewise-api/src/modules/auth/auth.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../../config/jwt");
const verifyToken_1 = require("../../middleware/verifyToken");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * ------------------------------------------------------
 * POST /api/auth/login
 * ------------------------------------------------------
 * Public login endpoint
 */
router.post("/login", async (req, res) => {
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
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
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            email: user.email,
        }, jwt_1.JWT_SECRET, { expiresIn: "7d" });
        // ✅ SET AUTH COOKIE (CANONICAL)
        res.cookie("tw_token", token, {
            httpOnly: true, // 🔒 secure
            sameSite: "lax", // ✅ localhost compatible
            secure: false, // ❗ true in HTTPS production
            path: "/", // 🔥 REQUIRED
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
    }
    catch (error) {
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
router.get("/current", verifyToken_1.verifyToken, (req, res) => {
    return res.json({
        user: req.user,
    });
});
/**
 * ------------------------------------------------------
 * POST /api/auth/logout
 * ------------------------------------------------------
 * Clears auth cookie
 */
router.post("/logout", (_req, res) => {
    res.clearCookie("tw_token", {
        path: "/",
    });
    return res.json({ success: true });
});
exports.default = router;
