import http from "node:http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import elevenlabsRoutes from "./routes/elevenlabs.js";
import telnyxRoutes from "./routes/telnyx.js";
import { attachTelnyxMediaWs } from "./ws/telnyx-media.js";

dotenv.config({ quiet: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/elevenlabs", elevenlabsRoutes);
app.use("/api/telnyx", telnyxRoutes);

const server = http.createServer(app);
attachTelnyxMediaWs(server);

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => {
  console.log(`wringo.ai backend listening on http://localhost:${PORT}`);
  console.log(`- ElevenLabs signer: http://localhost:${PORT}/api/elevenlabs/signed-url`);
  console.log(`- Telnyx inbound:     http://localhost:${PORT}/api/telnyx/inbound`);
  console.log(`- Telnyx media WS:    ws://localhost:${PORT}/ws/telnyx-media`);
});
