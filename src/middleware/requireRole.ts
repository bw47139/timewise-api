import { Request, Response, NextFunction } from "express";

type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export function requireRole(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!user || !user.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowed.includes(user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
      });
    }

    next();
  };
}
