"use client";
import { useState, useEffect, useRef } from "react";
import { useResponsive } from "../../../lib/useResponsive";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels?: { accent?: string; gender?: string; age?: string };
}

export default function VoicePage() {
  const { isMobile } = useResponsive();
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Voice cloning state
  const [cloning, setCloning] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "clone">("generate");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const ELEVENLABS_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

  // Load voices from ElevenLabs
  useEffect(() => {
    async function loadVoices() {
      if (!ELEVENLABS_KEY) {
        setError("Missing ElevenLabs API key");
        setLoadingVoices(false);
        return;
      }
      try {
        const res = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": ELEVENLABS_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          setVoices(data.voices || []);
          if (data.voices?.length > 0) {
            setSelectedVoice(data.voices[0].voice_id);
          }
        } else {
          setError("Failed to load voices");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingVoices(false);
      }
    }
    loadVoices();
  }, [ELEVENLABS_KEY]);

  // Generate speech
  async function generateSpeech() {
    if (!text.trim()) return alert("Enter some text first");
    if (!selectedVoice) return alert("Select a voice first");
    
    setGenerating(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Also save job to Supabase
        if (SUPABASE_URL && SUPABASE_KEY) {
          await fetch(`${SUPABASE_URL}/rest/v1/render_jobs`, {
            method: "POST",
            headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "voice",
              status: "completed",
              progress: 100,
              payload: { text, voice_id: selectedVoice },
              output_url: url,
            }),
          });
        }
      } else {
        const err = await res.json();
        setError(err.detail?.message || `Error ${res.status}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  // Clone voice
  async function cloneVoice() {
    if (!cloneName.trim()) return alert("Enter a name for your voice");
    if (cloneFiles.length === 0) return alert("Upload at least one audio sample");
    
    setCloning(true);
    setError(null);
    setCloneSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append("name", cloneName);
      formData.append("description", `Cloned voice: ${cloneName}`);
      cloneFiles.forEach((file, i) => {
        formData.append("files", file);
      });
      
      const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCloneSuccess(`Voice "${cloneName}" cloned successfully! Voice ID: ${data.voice_id}`);
        setCloneName("");
        setCloneFiles([]);
        // Refresh voices list
        const voicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": ELEVENLABS_KEY },
        });
        if (voicesRes.ok) {
          const voicesData = await voicesRes.json();
          setVoices(voicesData.voices || []);
          setSelectedVoice(data.voice_id);
        }
        setActiveTab("generate");
      } else {
        const err = await res.json();
        setError(err.detail?.message || err.detail?.status || `Clone failed: ${res.status}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCloning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setCloneFiles(Array.from(e.target.files));
    }
  }

  const cardStyle = {
    padding: isMobile ? "16px" : "24px",
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    border: "1px solid #333",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0a0a0a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "white",
    fontSize: isMobile ? "14px" : "16px",
  };

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/studio" style={{ color: "#888", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>
        ← Back to Studio
      </a>
      
      <h1 style={{ fontSize: isMobile ? "28px" : "42px", fontWeight: "bold", marginTop: "16px", marginBottom: "8px" }}>
        🎤 Voice Generator
      </h1>
      <p style={{ color: "#888", marginBottom: isMobile ? "20px" : "30px", fontSize: isMobile ? "14px" : "16px" }}>
        Generate AI speech or clone your own voice
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("generate")}
          style={{
            padding: isMobile ? "10px 16px" : "12px 24px",
            backgroundColor: activeTab === "generate" ? "#2563eb" : "#1a1a1a",
            color: "white",
            border: "1px solid #333",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: activeTab === "generate" ? "600" : "400",
          }}
        >
          🔊 Generate Speech
        </button>
        <button
          onClick={() => setActiveTab("clone")}
          style={{
            padding: isMobile ? "10px 16px" : "12px 24px",
            backgroundColor: activeTab === "clone" ? "#16a34a" : "#1a1a1a",
            color: "white",
            border: "1px solid #333",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: activeTab === "clone" ? "600" : "400",
          }}
        >
          🧬 Clone Voice
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#7f1d1d", borderRadius: "8px", marginBottom: "20px" }}>
          <p style={{ color: "#fca5a5", margin: 0, fontSize: "14px" }}>❌ {error}</p>
        </div>
      )}

      {cloneSuccess && (
        <div style={{ padding: "12px 16px", backgroundColor: "#14532d", borderRadius: "8px", marginBottom: "20px" }}>
          <p style={{ color: "#86efac", margin: 0, fontSize: "14px" }}>✅ {cloneSuccess}</p>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: isMobile ? "18px" : "20px", marginBottom: "20px" }}>Generate Speech</h2>
          
          {/* Voice Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
              Select Voice ({voices.length} available)
            </label>
            {loadingVoices ? (
              <p style={{ color: "#888" }}>Loading voices...</p>
            ) : (
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={inputStyle}
              >
                {voices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name} {v.labels?.gender ? `(${v.labels.gender})` : ""} - {v.category}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Text Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
              Text to Speak
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <p style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
              {text.length} characters
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSpeech}
            disabled={generating || !selectedVoice}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: generating ? "#333" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: generating ? "wait" : "pointer",
            }}
          >
            {generating ? "⏳ Generating..." : "🔊 Generate Speech"}
          </button>

          {/* Audio Player */}
          {audioUrl && (
            <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#0a0a0a", borderRadius: "8px" }}>
              <p style={{ color: "#4ade80", marginBottom: "12px", fontSize: "14px" }}>✅ Audio generated!</p>
              <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%" }} />
              <a
                href={audioUrl}
                download={`voice_${Date.now()}.mp3`}
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  padding: "10px 20px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                ⬇️ Download Audio
              </a>
            </div>
          )}
        </div>
      )}

      {/* Clone Tab */}
      {activeTab === "clone" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: isMobile ? "18px" : "20px", marginBottom: "8px" }}>Clone Your Voice</h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
            Upload audio samples of your voice to create a clone. Best results with 1-5 minutes of clear speech.
          </p>
          
          {/* Voice Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
              Voice Name
            </label>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="e.g., My Voice, Business Voice, etc."
              style={inputStyle}
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
              Audio Samples (MP3, WAV, M4A)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,.webm,audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm,audio/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
              capture={false as any}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "24px",
                backgroundColor: "#0a0a0a",
                border: "2px dashed #333",
                borderRadius: "8px",
                color: "#888",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              📁 Click to upload audio files
            </button>
            {cloneFiles.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ color: "#4ade80", fontSize: "14px", marginBottom: "8px" }}>
                  {cloneFiles.length} file(s) selected:
                </p>
                {cloneFiles.map((f, i) => (
                  <p key={i} style={{ color: "#888", fontSize: "13px", margin: "4px 0" }}>
                    • {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Clone Button */}
          <button
            onClick={cloneVoice}
            disabled={cloning || !cloneName.trim() || cloneFiles.length === 0}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: cloning ? "#333" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: cloning ? "wait" : "pointer",
              opacity: (!cloneName.trim() || cloneFiles.length === 0) ? 0.5 : 1,
            }}
          >
            {cloning ? "⏳ Cloning Voice..." : "🧬 Clone My Voice"}
          </button>

          {/* Tips */}
          <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#0a0a0a", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "#f59e0b" }}>💡 Tips for best results</h4>
            <ul style={{ color: "#888", fontSize: "13px", paddingLeft: "20px", lineHeight: "1.8", margin: 0 }}>
              <li>Use clear audio with minimal background noise</li>
              <li>Upload 1-5 minutes of speech total</li>
              <li>Multiple shorter clips work better than one long file</li>
              <li>Avoid music or other voices in the background</li>
              <li>Speak naturally - don't read in a monotone</li>
            </ul>
          </div>
        </div>
      )}

      {/* Your Cloned Voices */}
      {voices.filter(v => v.category === "cloned").length > 0 && (
        <div style={{ ...cardStyle, marginTop: "24px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>🎭 Your Cloned Voices</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {voices.filter(v => v.category === "cloned").map((v) => (
              <div
                key={v.voice_id}
                onClick={() => { setSelectedVoice(v.voice_id); setActiveTab("generate"); }}
                style={{
                  padding: "12px",
                  backgroundColor: selectedVoice === v.voice_id ? "#1e3a5f" : "#0a0a0a",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: selectedVoice === v.voice_id ? "1px solid #3b82f6" : "1px solid #333",
                }}
              >
                <span style={{ color: "white", fontSize: "14px" }}>{v.name}</span>
                <span style={{ color: "#888", fontSize: "12px", marginLeft: "8px" }}>• cloned</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
