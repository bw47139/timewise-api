"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
/**
 * ======================================================
 * verifyToken
 * ------------------------------------------------------
 * FIXED VERSION:
 * - ALWAYS checks Bearer token FIRST
 * - THEN checks httpOnly cookie
 * - More compatible with Thunder Client, Postman, cURL
 * ======================================================
 */
function verifyToken(req, res, next) {
    try {
        let token;
        // --------------------------------------------------
        // 1️⃣ FIRST: Authorization Bearer header
        // --------------------------------------------------
        const authHeader = req.headers["authorization"];
        if (authHeader &&
            typeof authHeader === "string" &&
            authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        // --------------------------------------------------
        // 2️⃣ SECOND: httpOnly cookie
        // --------------------------------------------------
        if (!token && req.cookies?.tw_token) {
            token = req.cookies.tw_token;
        }
        // --------------------------------------------------
        // ❌ No token at all
        // --------------------------------------------------
        if (!token) {
            console.error("❌ verifyToken: No token found", {
                path: req.originalUrl,
                cookies: req.cookies,
                headers: req.headers,
            });
            return res.status(401).json({ error: "Unauthorized" });
        }
        // --------------------------------------------------
        // 3️⃣ Verify JWT
        // --------------------------------------------------
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.JWT_SECRET);
        if (typeof decoded !== "object" || decoded === null) {
            console.error("❌ verifyToken: Invalid JWT payload");
            return res.status(401).json({ error: "Invalid token" });
        }
        // --------------------------------------------------
        // 4️⃣ Attach user to req.user
        // --------------------------------------------------
        req.user = decoded;
        return next();
    }
    catch (error) {
        console.error("❌ verifyToken: JWT verification failed", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
/**
 * RBAC
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        return next();
    };
}
