"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signClockFallbackToken = signClockFallbackToken;
exports.verifyClockFallbackToken = verifyClockFallbackToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
function signClockFallbackToken(locationId) {
    const ttl = Number(process.env.CLOCK_FALLBACK_TTL_SECONDS || 120);
    return jsonwebtoken_1.default.sign({ locationId }, JWT_SECRET, {
        expiresIn: ttl,
    });
}
function verifyClockFallbackToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
