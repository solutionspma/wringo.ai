"use client";
import { useState } from "react";
import { useResponsive } from "../../../lib/useResponsive";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  time?: number;
}

export default function APITestPage() {
  const { isMobile } = useResponsive();
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
  const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
  const ELEVENLABS_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";

  function updateResult(name: string, status: TestResult["status"], message: string, time?: number) {
    setResults(prev => {
      const idx = prev.findIndex(r => r.name === name);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { name, status, message, time };
        return updated;
      }
      return [...prev, { name, status, message, time }];
    });
  }

  async function runAllTests() {
    setTesting(true);
    setResults([]);

    // Test 1: Supabase Connection
    updateResult("Supabase", "pending", "Testing connection...");
    const supaStart = Date.now();
    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        updateResult("Supabase", "error", "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_KEY");
      } else {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/render_jobs?select=id&limit=1`, {
          headers: { apikey: SUPABASE_KEY },
        });
        if (res.ok) {
          updateResult("Supabase", "success", "Connected! Database accessible.", Date.now() - supaStart);
        } else {
          const err = await res.text();
          updateResult("Supabase", "error", `Error ${res.status}: ${err}`, Date.now() - supaStart);
        }
      }
    } catch (e: any) {
      updateResult("Supabase", "error", e.message, Date.now() - supaStart);
    }

    // Test 2: OpenAI API
    updateResult("OpenAI", "pending", "Testing API key...");
    const openaiStart = Date.now();
    try {
      if (!OPENAI_KEY) {
        updateResult("OpenAI", "error", "Missing NEXT_PUBLIC_OPENAI_API_KEY in env");
      } else {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${OPENAI_KEY}` },
        });
        if (res.ok) {
          const data = await res.json();
          updateResult("OpenAI", "success", `Connected! ${data.data?.length || 0} models available.`, Date.now() - openaiStart);
        } else {
          const err = await res.json();
          updateResult("OpenAI", "error", err.error?.message || `Error ${res.status}`, Date.now() - openaiStart);
        }
      }
    } catch (e: any) {
      updateResult("OpenAI", "error", e.message, Date.now() - openaiStart);
    }

    // Test 3: ElevenLabs API
    updateResult("ElevenLabs", "pending", "Testing API key...");
    const elevenStart = Date.now();
    try {
      if (!ELEVENLABS_KEY) {
        updateResult("ElevenLabs", "error", "Missing NEXT_PUBLIC_ELEVENLABS_API_KEY in env");
      } else {
        const res = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": ELEVENLABS_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          updateResult("ElevenLabs", "success", `Connected! ${data.voices?.length || 0} voices available.`, Date.now() - elevenStart);
        } else {
          const err = await res.json();
          updateResult("ElevenLabs", "error", err.detail?.message || `Error ${res.status}`, Date.now() - elevenStart);
        }
      }
    } catch (e: any) {
      updateResult("ElevenLabs", "error", e.message, Date.now() - elevenStart);
    }

    // Test 4: Pexels API
    updateResult("Pexels", "pending", "Testing API key...");
    const pexelsStart = Date.now();
    try {
      if (!PEXELS_KEY) {
        updateResult("Pexels", "error", "Missing NEXT_PUBLIC_PEXELS_API_KEY in env");
      } else {
        const res = await fetch("https://api.pexels.com/v1/search?query=test&per_page=1", {
          headers: { Authorization: PEXELS_KEY },
        });
        if (res.ok) {
          updateResult("Pexels", "success", "Connected! Stock media accessible.", Date.now() - pexelsStart);
        } else {
          updateResult("Pexels", "error", `Error ${res.status}`, Date.now() - pexelsStart);
        }
      }
    } catch (e: any) {
      updateResult("Pexels", "error", e.message, Date.now() - pexelsStart);
    }

    setTesting(false);
  }

  // Quick Voice Generation Test
  async function testVoiceGeneration() {
    if (!ELEVENLABS_KEY) {
      alert("Missing NEXT_PUBLIC_ELEVENLABS_API_KEY");
      return;
    }
    updateResult("Voice Gen", "pending", "Generating test audio...");
    const start = Date.now();
    try {
      // First get a voice ID
      const voicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": ELEVENLABS_KEY },
      });
      const voices = await voicesRes.json();
      const voiceId = voices.voices?.[0]?.voice_id;
      
      if (!voiceId) {
        updateResult("Voice Gen", "error", "No voices available");
        return;
      }

      // Generate speech
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Hello! This is a test from YO Creator. Your voice API is working perfectly.",
          model_id: "eleven_multilingual_v2",
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        // Play the audio
        const audio = new Audio(url);
        audio.play();
        updateResult("Voice Gen", "success", `Generated ${(blob.size / 1024).toFixed(1)}KB audio!`, Date.now() - start);
      } else {
        const err = await res.json();
        updateResult("Voice Gen", "error", err.detail?.message || `Error ${res.status}`, Date.now() - start);
      }
    } catch (e: any) {
      updateResult("Voice Gen", "error", e.message, Date.now() - start);
    }
  }

  // Quick OpenAI Test
  async function testOpenAIGeneration() {
    if (!OPENAI_KEY) {
      alert("Missing NEXT_PUBLIC_OPENAI_API_KEY");
      return;
    }
    updateResult("AI Script", "pending", "Generating test script...");
    const start = Date.now();
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Write a 2 sentence video intro for a tech product." }],
          max_tokens: 100,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        updateResult("AI Script", "success", `Generated: "${text.slice(0, 80)}..."`, Date.now() - start);
      } else {
        const err = await res.json();
        updateResult("AI Script", "error", err.error?.message || `Error ${res.status}`, Date.now() - start);
      }
    } catch (e: any) {
      updateResult("AI Script", "error", e.message, Date.now() - start);
    }
  }

  const cardStyle = {
    padding: isMobile ? "12px" : "16px",
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    border: "1px solid #333",
    marginBottom: "8px",
  };

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "800px", margin: "0 auto" }}>
      <a href="/studio" style={{ color: "#888", textDecoration: "none" }}>← Back to Studio</a>
      
      <h1 style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: "bold", marginTop: "16px", marginBottom: "8px" }}>
        🔧 API Test Center
      </h1>
      <p style={{ color: "#888", marginBottom: "24px" }}>
        Verify your API keys are configured correctly
      </p>

      {/* Run All Tests Button */}
      <button
        onClick={runAllTests}
        disabled={testing}
        style={{
          width: "100%",
          padding: "16px",
          backgroundColor: testing ? "#333" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: testing ? "wait" : "pointer",
          marginBottom: "24px",
        }}
      >
        {testing ? "⏳ Running Tests..." : "🚀 Run All API Tests"}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Test Results</h2>
          {results.map((r) => (
            <div key={r.name} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>
                    {r.status === "pending" ? "⏳" : r.status === "success" ? "✅" : "❌"}
                  </span>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{r.name}</div>
                    <div style={{ color: r.status === "error" ? "#ef4444" : "#888", fontSize: "13px" }}>
                      {r.message}
                    </div>
                  </div>
                </div>
                {r.time && (
                  <span style={{ color: "#666", fontSize: "12px" }}>{r.time}ms</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Tests */}
      <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Quick Generation Tests</h2>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
        <button
          onClick={testVoiceGeneration}
          style={{
            padding: "16px",
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          🎤 Test Voice Generation
        </button>
        <button
          onClick={testOpenAIGeneration}
          style={{
            padding: "16px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          🤖 Test AI Script Generation
        </button>
      </div>

      {/* Environment Info */}
      <div style={{ marginTop: "32px", padding: "16px", backgroundColor: "#0a0a0a", borderRadius: "8px", border: "1px solid #222" }}>
        <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Environment Status</h3>
        <div style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>SUPABASE_URL</span>
            <span style={{ color: SUPABASE_URL ? "#4ade80" : "#ef4444" }}>{SUPABASE_URL ? "✓ Set" : "✗ Missing"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>SUPABASE_KEY</span>
            <span style={{ color: SUPABASE_KEY ? "#4ade80" : "#ef4444" }}>{SUPABASE_KEY ? "✓ Set" : "✗ Missing"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>OPENAI_API_KEY</span>
            <span style={{ color: OPENAI_KEY ? "#4ade80" : "#ef4444" }}>{OPENAI_KEY ? "✓ Set" : "✗ Missing"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>ELEVENLABS_API_KEY</span>
            <span style={{ color: ELEVENLABS_KEY ? "#4ade80" : "#ef4444" }}>{ELEVENLABS_KEY ? "✓ Set" : "✗ Missing"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>PEXELS_API_KEY</span>
            <span style={{ color: PEXELS_KEY ? "#4ade80" : "#ef4444" }}>{PEXELS_KEY ? "✓ Set" : "✗ Missing"}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
