"use strict";
// src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const websocket_1 = require("./websocket");
const router_1 = require("./modules/router");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const timecard_routes_1 = __importDefault(require("./modules/timecard/timecard.routes"));
const router_2 = __importDefault(require("./modules/clock/router"));
const employeeProfilePdf_routes_1 = __importDefault(require("./modules/reports/employeeProfilePdf.routes"));
const routeInspector_1 = require("./utils/routeInspector");
const auditContext_1 = require("./middleware/auditContext");
const verifyToken_1 = require("./middleware/verifyToken");
// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
console.log("🔥 RUNNING SERVER.TS 🔥");
const app = (0, express_1.default)();
// ---------------------------------------------------------
// GLOBAL MIDDLEWARE
// ---------------------------------------------------------
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-device-id",
    ],
}));
// ⭐ IMPORTANT — handle preflight for PATCH/PUT/DELETE/routes
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ---------------------------------------------------------
// PUBLIC ROUTES (NO AUTH)
// ---------------------------------------------------------
// Health
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "timewise-api",
        timestamp: new Date().toISOString(),
    });
});
// Auth (login)
app.use("/api/auth", auth_routes_1.default);
app.use("/api/login", auth_routes_1.default);
// CLOCK / KIOSK ROUTES (NO AUTH)
app.use("/api/clock", router_2.default);
// ---------------------------------------------------------
// AUDIT CONTEXT
// ---------------------------------------------------------
app.use(auditContext_1.auditContext);
// ---------------------------------------------------------
// AUTH GATE (PROTECT ALL OTHER /api ROUTES)
// ---------------------------------------------------------
app.use("/api", (req, res, next) => {
    // Allow-list for public endpoints
    if (req.path === "/health" ||
        req.path === "/login" ||
        req.path.startsWith("/auth") ||
        req.path.startsWith("/clock")) {
        return next();
    }
    // All other API routes require JWT
    return (0, verifyToken_1.verifyToken)(req, res, next);
});
// ---------------------------------------------------------
// PROTECTED ROUTES
// ---------------------------------------------------------
// Timecards
app.use("/api/timecards", timecard_routes_1.default);
// Employee Profile PDF
app.use("/api/reports", employeeProfilePdf_routes_1.default);
// Auto-mounted modules (employee, location, payroll, etc.)
app.use("/api", router_1.apiRouter);
// ---------------------------------------------------------
// DEBUG ROUTES
// ---------------------------------------------------------
app.get("/api/_debug/routes", (_req, res) => {
    res.json((0, routeInspector_1.getLiveRoutes)(app));
});
// ---------------------------------------------------------
// ROOT
// ---------------------------------------------------------
app.get("/", (_req, res) => {
    res.send("TimeWise API is running");
});
// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
const server = http_1.default.createServer(app);
(0, websocket_1.initWebSocket)(server);
server.listen(4000, () => {
    console.log("🚀 TimeWise API running on port 4000");
    (0, routeInspector_1.printLiveRoutes)(app, "LIVE ROUTE MAP");
});
