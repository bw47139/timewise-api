// src/server.ts

import http from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { initWebSocket } from "./websocket";
import { apiRouter } from "./modules/router";
import authRouter from "./modules/auth/auth.routes";
import timecardRouter from "./modules/timecard/timecard.routes";
import clockRouter from "./modules/clock/router";

import employeeProfilePdfRouter from "./modules/reports/employeeProfilePdf.routes";

import { getLiveRoutes, printLiveRoutes } from "./utils/routeInspector";
import { auditContext } from "./middleware/auditContext";
import { verifyToken } from "./middleware/verifyToken";

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
console.log("🔥 RUNNING SERVER.TS 🔥");
const app = express();

// ---------------------------------------------------------
// GLOBAL MIDDLEWARE
// ---------------------------------------------------------
app.use(
  cors({
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
  })
);

// ⭐ IMPORTANT — handle preflight for PATCH/PUT/DELETE/routes
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------------------------------------------
// PUBLIC ROUTES (NO AUTH)
// ---------------------------------------------------------

// Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "timewise-api",
    timestamp: new Date().toISOString(),
  });
});

// Auth (login)
app.use("/api/auth", authRouter);
app.use("/api/login", authRouter);

// CLOCK / KIOSK ROUTES (NO AUTH)
app.use("/api/clock", clockRouter);

// ---------------------------------------------------------
// AUDIT CONTEXT
// ---------------------------------------------------------
app.use(auditContext);

// ---------------------------------------------------------
// AUTH GATE (PROTECT ALL OTHER /api ROUTES)
// ---------------------------------------------------------
app.use("/api", (req, res, next) => {
  // Allow-list for public endpoints
  if (
    req.path === "/health" ||
    req.path === "/login" ||
    req.path.startsWith("/auth") ||
    req.path.startsWith("/clock")
  ) {
    return next();
  }

  // All other API routes require JWT
  return verifyToken(req as any, res as any, next);
});

// ---------------------------------------------------------
// PROTECTED ROUTES
// ---------------------------------------------------------

// Timecards
app.use("/api/timecards", timecardRouter);

// Employee Profile PDF
app.use("/api/reports", employeeProfilePdfRouter);

// Auto-mounted modules (employee, location, payroll, etc.)
app.use("/api", apiRouter);

// ---------------------------------------------------------
// DEBUG ROUTES
// ---------------------------------------------------------
app.get("/api/_debug/routes", (_req, res) => {
  res.json(getLiveRoutes(app));
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
const server = http.createServer(app);
initWebSocket(server);

server.listen(4000, () => {
  console.log("🚀 TimeWise API running on port 4000");
  printLiveRoutes(app, "LIVE ROUTE MAP");
});
