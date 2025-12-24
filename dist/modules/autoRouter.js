"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedRouter = exports.publicRouter = void 0;
// src/modules/autoRouter.ts
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const verifyToken_1 = require("../middleware/verifyToken");
/**
 * ------------------------------------------------------
 * Routers
 * ------------------------------------------------------
 * publicRouter   → NO AUTH (kiosk, health)
 * protectedRouter → JWT REQUIRED (dashboard, admin)
 */
exports.publicRouter = (0, express_1.Router)();
exports.protectedRouter = (0, express_1.Router)();
const modulesPath = __dirname;
fs_1.default.readdirSync(modulesPath).forEach((moduleName) => {
    const moduleDir = path_1.default.join(modulesPath, moduleName);
    // Skip non-folders
    if (!fs_1.default.statSync(moduleDir).isDirectory())
        return;
    // Skip autoRouter and router internal folders
    if (["router", "autoRouter"].includes(moduleName))
        return;
    let moduleRouter = null;
    /**
     * ------------------------------------------------------
     * 1. TRY index.ts / index.js FIRST (standard)
     * ------------------------------------------------------
     */
    const indexTs = path_1.default.join(moduleDir, "index.ts");
    const indexJs = path_1.default.join(moduleDir, "index.js");
    if (fs_1.default.existsSync(indexTs)) {
        try {
            moduleRouter = require(indexTs).default;
        }
        catch (err) {
            console.error(`❌ Failed loading index.ts for module ${moduleName}`);
            console.error(err);
        }
    }
    else if (fs_1.default.existsSync(indexJs)) {
        try {
            moduleRouter = require(indexJs).default;
        }
        catch (err) {
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
        const routeFiles = fs_1.default
            .readdirSync(moduleDir)
            .filter((file) => file.endsWith(".routes.ts") || file.endsWith(".routes.js"));
        if (routeFiles.length > 0) {
            const routeFile = routeFiles[0]; // use the first found route file
            const fullPath = path_1.default.join(moduleDir, routeFile);
            try {
                moduleRouter = require(fullPath).default;
                console.log(`🔍 Fallback router detected: ${moduleName}/${routeFile}`);
            }
            catch (err) {
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
        exports.publicRouter.use(`/${moduleName}`, moduleRouter);
        console.log(`🌐 Public module mounted: /${moduleName}`);
        return;
    }
    /**
     * ------------------------------------------------------
     * PROTECTED MODULES (JWT REQUIRED)
     * ------------------------------------------------------
     */
    exports.protectedRouter.use(`/${moduleName}`, verifyToken_1.verifyToken, moduleRouter);
    console.log(`🔒 Protected module mounted: /${moduleName}`);
});
