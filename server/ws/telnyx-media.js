import { WebSocketServer } from "ws";

export function attachTelnyxMediaWs(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const { url = "" } = req;
    if (url.startsWith("/ws/telnyx-media")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
      return;
    }

    socket.destroy();
  });

  wss.on("connection", (ws) => {
    console.log("📡 Telnyx media WS connected");

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString("utf8"));

        // Telnyx Media Streaming events vary by configuration.
        // We log minimal info so you can confirm frames arrive.
        if (msg.event) {
          if (msg.event === "media" && msg.media?.payload) {
            // payload is typically base64 audio frames
            // eslint-disable-next-line no-unused-vars
            const frameLen = msg.media.payload.length;
            return;
          }
        }
      } catch {
        // ignore non-JSON
      }
    });

    ws.on("close", () => console.log("📴 Telnyx media WS disconnected"));
  });

  return wss;
}
