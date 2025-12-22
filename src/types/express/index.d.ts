// src/types/express/index.d.ts
import { AuthRequest } from "../../middleware/verifyToken";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthRequest["user"];
  }
}
