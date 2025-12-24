"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptEmbedding = encryptEmbedding;
exports.decryptEmbedding = decryptEmbedding;
exports.calculateDistance = calculateDistance;
const crypto_js_1 = __importDefault(require("crypto-js"));
const SECRET = process.env.FACE_SECRET;
/**
 * Encrypt face embedding before saving
 */
function encryptEmbedding(vector) {
    return crypto_js_1.default.AES.encrypt(JSON.stringify(vector), SECRET).toString();
}
/**
 * Decrypt face embedding from DB
 */
function decryptEmbedding(encrypted) {
    const bytes = crypto_js_1.default.AES.decrypt(encrypted, SECRET);
    return JSON.parse(bytes.toString(crypto_js_1.default.enc.Utf8));
}
/**
 * Euclidean distance comparison
 */
function calculateDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}
