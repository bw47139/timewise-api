// src/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request typing
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        organizationId: number;
        role: string;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

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
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
