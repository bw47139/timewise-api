// src/types/express.d.ts

import "express";
import { User } from "@prisma/client";

declare global {
  namespace Express {
    /**
     * --------------------------------------------------
     * Multer typings
     * --------------------------------------------------
     */
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer?: Buffer;
      }
    }

    /**
     * --------------------------------------------------
     * Request augmentation
     * --------------------------------------------------
     */
    interface Request {
      /**
       * Canonical authenticated user object
       * (used by newer middleware/routes)
       */
      auth?: {
        userId: number;
        organizationId: number;
        role?: string;
        email?: string;
      };

      /**
       * Legacy alias (kept for backward compatibility)
       */
      user?: {
        userId: number;
        organizationId: number;
        role?: string;
        email?: string;
      };

      /**
       * Multer — single file upload
       */
      file?: Express.Multer.File;

      /**
       * Multer — multiple files
       */
      files?:
        | Express.Multer.File[]
        | {
            [fieldname: string]: Express.Multer.File[];
          };
    }
  }
}

export {};
