import http from "node:http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import elevenlabsRoutes from "./routes/elevenlabs.js";
import telnyxRoutes from "./routes/telnyx.js";
import webhooksRoutes from "./routes/webhooks.js";
import leadsRoutes from "./routes/leads.js";
import referralsRoutes from "./routes/referrals.js";
import { attachTelnyxMediaWs } from "./ws/telnyx-media.js";
import level10crm from "./services/modcrm.js";

dotenv.config({ quiet: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Root route for health probes
app.get("/", (_req, res) => res.json({ 
  service: "wringo.ai backend",
  status: "running",
  version: "5.0.1"
}));

// Health check with service status
app.get("/health", (_req, res) => res.json({ 
  ok: true,
  version: "6.6-bidirectional-rtp", // Version marker for deployment verification
  services: {
    level10crm: level10crm.getStatus()
  }
}));

// API Routes
app.use("/api/elevenlabs", elevenlabsRoutes);
app.use("/api/telnyx", telnyxRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/referrals", referralsRoutes);

// Level 10 CRM status endpoint
app.get("/api/level10crm/status", (_req, res) => {
  res.json(level10crm.getStatus());
});

const server = http.createServer(app);
attachTelnyxMediaWs(server);

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => {
  console.log(`\n🚀 wringo.ai backend listening on http://localhost:${PORT}\n`);
  console.log(`📡 API Endpoints:`);
  console.log(`   - ElevenLabs signer: GET  /api/elevenlabs/signed-url`);
  console.log(`   - Telnyx inbound:    POST /api/telnyx/inbound`);
  console.log(`   - Webhooks:          POST /api/webhooks/elevenlabs`);
  console.log(`   - Leads API:         POST /api/leads`);
  console.log(`   - Referrals API:     POST /api/referrals/capture`);
  console.log(`   - Level 10 CRM:      GET  /api/level10crm/status`);
  console.log(`   - WebSocket:         WS   /ws/telnyx-media`);
  console.log(`\n🔗 Supabase: ${level10crm.isConfigured() ? "✅ Configured" : "⚠️  Not configured (set WRINGO_SUPABASE_URL & WRINGO_SUPABASE_SERVICE_KEY)"}`);
});
