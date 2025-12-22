import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        organizationId: number;
        role?: string;
        email?: string;
      };
    }
  }
}

export {};
