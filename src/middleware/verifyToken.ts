import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

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
export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    // --------------------------------------------------
    // 1️⃣ FIRST: Authorization Bearer header
    // --------------------------------------------------
    const authHeader = req.headers["authorization"];
    if (
      authHeader &&
      typeof authHeader === "string" &&
      authHeader.startsWith("Bearer ")
    ) {
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
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== "object" || decoded === null) {
      console.error("❌ verifyToken: Invalid JWT payload");
      return res.status(401).json({ error: "Invalid token" });
    }

    // --------------------------------------------------
    // 4️⃣ Attach user to req.user
    // --------------------------------------------------
    (req as any).user = decoded;

    return next();
  } catch (error) {
    console.error("❌ verifyToken: JWT verification failed", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * RBAC
 */
export function requireRole(
  allowedRoles: Array<"ADMIN" | "MANAGER" | "SUPERVISOR">
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}
