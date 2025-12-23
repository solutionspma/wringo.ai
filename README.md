# wringo.ai

Private ElevenLabs Conversational AI (signed URL) + a minimal browser mic UI.

## 1) Setup

Create a real `.env`:

```sh
cp .env.example .env
```

Edit `.env` and set:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID` (this should look like `agent_...`, not the display name)

## 2) Run locally

Terminal 1 (backend):

```sh
npm run dev
```

Terminal 2 (static client):

```sh
npm run dev:client
```

Open:

- `http://localhost:5173`

Backend endpoints:

- `http://localhost:3001/api/elevenlabs/signed-url`
- `http://localhost:3001/api/telnyx/inbound`

## 3) Telnyx notes (later)

When you deploy, set:

- `TELNYX_MEDIA_WS_URL=wss://YOUR_DOMAIN/ws/telnyx-media`

Then configure your Telnyx Call Control webhook to:

- `https://YOUR_DOMAIN/api/telnyx/inbound`
