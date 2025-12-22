// src/websocket.ts
import type { Server } from "http";

import { WebSocketServer, WebSocket } from "ws";

export interface PunchEventPayload {
  punchId: number;
  employeeId: number;
  employeeName: string;
  type: "IN" | "OUT";
  timestamp: string; // ISO string
  locationName?: string;
}

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

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
export function broadcastPunch(event: PunchEventPayload) {
  if (!wss) return;

  const message = JSON.stringify({
    type: "PUNCH_EVENT",
    data: event,
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
