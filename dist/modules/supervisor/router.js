"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supervisorModuleRouter = void 0;
// src/modules/supervisor/router.ts
const express_1 = require("express");
const verifyToken_1 = require("../../middleware/verifyToken");
const supervisor_routes_1 = __importDefault(require("./supervisor.routes"));
const supervisor_edit_routes_1 = __importDefault(require("./supervisor.edit.routes"));
const supervisor_shift_routes_1 = __importDefault(require("./supervisor.shift.routes"));
const supervisor_timesheet_routes_1 = __importDefault(require("./supervisor.timesheet.routes"));
const supervisor_delete_routes_1 = __importDefault(require("./supervisor.delete.routes"));
exports.supervisorModuleRouter = (0, express_1.Router)();
// PROTECTED
exports.supervisorModuleRouter.use("/api/supervisor", verifyToken_1.verifyToken, supervisor_routes_1.default);
exports.supervisorModuleRouter.use("/api/supervisor", verifyToken_1.verifyToken, supervisor_edit_routes_1.default);
exports.supervisorModuleRouter.use("/api/supervisor", verifyToken_1.verifyToken, supervisor_shift_routes_1.default);
exports.supervisorModuleRouter.use("/api/supervisor", verifyToken_1.verifyToken, supervisor_timesheet_routes_1.default);
exports.supervisorModuleRouter.use("/api/supervisor", verifyToken_1.verifyToken, supervisor_delete_routes_1.default);
