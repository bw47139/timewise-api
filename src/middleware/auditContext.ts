import { Request, Response, NextFunction } from "express";

export interface AuditContext {
  userId?: number;
  userEmail?: string;
  method: string;
  path: string;
  ipAddress?: string;
}

declare global {
  namespace Express {
    interface Request {
      audit?: AuditContext;
    }
  }
}

export function auditContext(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  req.audit = {
    method: req.method,
    path: req.originalUrl,
    ipAddress: req.ip,
  };

  // If auth middleware already ran
  if ((req as any).user) {
    req.audit.userId = (req as any).user.id;
    req.audit.userEmail = (req as any).user.email;
  }

  next();
}
