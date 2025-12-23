import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/signed-url", async (_req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });
    }
    if (!agentId) {
      return res.status(500).json({ error: "Missing ELEVENLABS_AGENT_ID" });
    }

    const response = await fetch(
      "https://api.elevenlabs.io/v1/conversation/get_signed_url",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent_id: agentId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "ElevenLabs error", details: data });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

export default router;
