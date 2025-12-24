// src/modules/autoRouter.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { verifyToken } from "../middleware/verifyToken";

/**
 * ------------------------------------------------------
 * Routers
 * ------------------------------------------------------
 * publicRouter   → NO AUTH (kiosk, health)
 * protectedRouter → JWT REQUIRED (dashboard, admin)
 */
export const publicRouter = Router();
export const protectedRouter = Router();

const modulesPath = __dirname;

fs.readdirSync(modulesPath).forEach((moduleName) => {
  const moduleDir = path.join(modulesPath, moduleName);

  // Skip non-folders
  if (!fs.statSync(moduleDir).isDirectory()) return;

  // Skip autoRouter and router internal folders
  if (["router", "autoRouter"].includes(moduleName)) return;

  let moduleRouter: any = null;

  /**
   * ------------------------------------------------------
   * 1. TRY index.ts / index.js FIRST (standard)
   * ------------------------------------------------------
   */
  const indexTs = path.join(moduleDir, "index.ts");
  const indexJs = path.join(moduleDir, "index.js");

  if (fs.existsSync(indexTs)) {
    try {
      moduleRouter = require(indexTs).default;
    } catch (err) {
      console.error(`❌ Failed loading index.ts for module ${moduleName}`);
      console.error(err);
    }
  } else if (fs.existsSync(indexJs)) {
    try {
      moduleRouter = require(indexJs).default;
    } catch (err) {
      console.error(`❌ Failed loading index.js for module ${moduleName}`);
      console.error(err);
    }
  }

  /**
   * ------------------------------------------------------
   * 2. FALLBACK — auto-detect ANY *.routes.ts file
   * ------------------------------------------------------
   * Example:
   *   location.routes.ts
   *   department.routes.ts
   *   jobtitle.routes.ts
   */
  if (!moduleRouter) {
    const routeFiles = fs
      .readdirSync(moduleDir)
      .filter((file) => file.endsWith(".routes.ts") || file.endsWith(".routes.js"));

    if (routeFiles.length > 0) {
      const routeFile = routeFiles[0]; // use the first found route file
      const fullPath = path.join(moduleDir, routeFile);

      try {
        moduleRouter = require(fullPath).default;
        console.log(`🔍 Fallback router detected: ${moduleName}/${routeFile}`);
      } catch (err) {
        console.error(`❌ Failed loading fallback route file for ${moduleName}`);
        console.error(err);
      }
    }
  }

  // If still no router, skip module
  if (!moduleRouter) {
    console.warn(`⚠️ Skipped module '${moduleName}' (no router found)`);
    return;
  }

  /**
   * ------------------------------------------------------
   * PUBLIC MODULES (NO AUTH)
   * ------------------------------------------------------
   */
  if (moduleName === "clock" || moduleName === "health") {
    publicRouter.use(`/${moduleName}`, moduleRouter);
    console.log(`🌐 Public module mounted: /${moduleName}`);
    return;
  }

  /**
   * ------------------------------------------------------
   * PROTECTED MODULES (JWT REQUIRED)
   * ------------------------------------------------------
   */
  protectedRouter.use(`/${moduleName}`, verifyToken, moduleRouter);
  console.log(`🔒 Protected module mounted: /${moduleName}`);
});
