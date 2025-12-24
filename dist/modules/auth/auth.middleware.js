"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Attach decoded JWT values to request object
        req.user = {
            userId: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role,
        };
        if (!req.user.organizationId) {
            console.error("Token missing organizationId");
            return res.status(401).json({ error: "Unauthorized" });
        }
        return next();
    }
    catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({ error: "Unauthorized" });
    }
};
exports.authMiddleware = authMiddleware;
