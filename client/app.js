import { Conversation } from "https://cdn.jsdelivr.net/npm/@elevenlabs/client/+esm";

const pill = document.getElementById("pill");
const btn = document.getElementById("toggleBtn");
const logEl = document.getElementById("log");
const orb = document.getElementById("orb");

let conversation;
let started = false;

function log(line) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${line}\n` + logEl.textContent;
}

function setStatus(text, { speaking = false } = {}) {
  pill.textContent = text;
  pill.classList.toggle("speaking", speaking);
  orb.classList.toggle("speaking", speaking);
}

async function startConversation() {
  setStatus("Requesting mic…");
  await navigator.mediaDevices.getUserMedia({ audio: true });

  setStatus("Fetching signed URL…");
  const res = await fetch("http://localhost:3001/api/elevenlabs/signed-url");
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Failed to get signed URL");
  }

  const signedUrl = data?.signed_url;
  if (!signedUrl) throw new Error("signed_url missing from server response");

  setStatus("Connecting…");

  conversation = new Conversation({
    url: signedUrl,
    onConnect: () => {
      log("Connected");
      setStatus("Listening…");
      btn.textContent = "Stop conversation";
    },
    onDisconnect: () => {
      log("Disconnected");
      setStatus("Disconnected");
      btn.textContent = "Start conversation";
      started = false;
    },
    onError: (err) => {
      console.error(err);
      log(`Error: ${err?.message || String(err)}`);
      setStatus("Error");
      btn.textContent = "Start conversation";
      started = false;
    },
    onMessage: (msg) => {
      // msg shape depends on the SDK; logging raw is safest.
      log(`Agent message: ${JSON.stringify(msg)}`);
    },
  });

  conversation.on("isSpeaking", (speaking) => {
    setStatus(speaking ? "Jason is speaking…" : "Listening…", { speaking });
  });

  await conversation.startSession();
  started = true;
}

async function stopConversation() {
  try {
    setStatus("Stopping…");
    await conversation?.endSession?.();
  } finally {
    started = false;
    setStatus("Idle");
    btn.textContent = "Start conversation";
  }
}

btn.addEventListener("click", async () => {
  btn.disabled = true;
  try {
    if (started) {
      await stopConversation();
    } else {
      await startConversation();
    }
  } catch (err) {
    console.error(err);
    log(`Failed: ${err?.message || String(err)}`);
    setStatus("Failed");
  } finally {
    btn.disabled = false;
  }
});
