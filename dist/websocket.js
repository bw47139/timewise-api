"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = initWebSocket;
exports.broadcastPunch = broadcastPunch;
const ws_1 = require("ws");
let wss = null;
function initWebSocket(server) {
    wss = new ws_1.WebSocketServer({ server });
    wss.on("connection", (ws) => {
        console.log("📡 WebSocket client connected");
        ws.on("close", () => {
            console.log("🔌 WebSocket client disconnected");
        });
    });
}
/**
 * Broadcast a punch event to all connected dashboard clients
 */
function broadcastPunch(event) {
    if (!wss)
        return;
    const message = JSON.stringify({
        type: "PUNCH_EVENT",
        data: event,
    });
    for (const client of wss.clients) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    }
}
