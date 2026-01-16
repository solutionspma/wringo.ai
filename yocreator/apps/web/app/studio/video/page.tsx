"use client";
import { useState, useEffect, useRef } from "react";
import { useResponsive } from "../../../lib/useResponsive";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

interface VideoResult {
  audioUrl: string;
  stockVideos: { url: string; image: string }[];
  script: string;
}

export default function VideoPage() {
  const { isMobile, isTablet } = useResponsive();
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [template, setTemplate] = useState("commercial");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [addCaptions, setAddCaptions] = useState(true);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
  const ELEVENLABS_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";
  const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

  // Load voices
  useEffect(() => {
    async function loadVoices() {
      if (!ELEVENLABS_KEY) return;
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
        }
      } catch (e) {
        console.error("Failed to load voices:", e);
      }
    }
    loadVoices();
  }, [ELEVENLABS_KEY]);

  async function generateVideo() {
    if (!script.trim()) return alert("Enter a script first");
    if (!selectedVoice) return alert("Select a voice first");

    setGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const newJobId = `job_${Date.now()}`;
    setJobId(newJobId);

    try {
      // Step 1: Generate voiceover (0-40%)
      setProgressText("🎙️ Generating voiceover...");
      setProgress(10);

      const audioRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!audioRes.ok) {
        const err = await audioRes.json();
        throw new Error(err.detail?.message || `Voice generation failed: ${audioRes.status}`);
      }

      const audioBlob = await audioRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setProgress(40);

      // Step 2: Find relevant stock videos (40-70%)
      setProgressText("🎬 Finding stock footage...");
      
      // Extract keywords from script for stock video search
      const keywords = script.split(/\s+/).slice(0, 3).join(" ") || "business technology";
      
      const pexelsRes = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=4&size=medium`,
        { headers: { Authorization: PEXELS_KEY } }
      );

      let stockVideos: { url: string; image: string }[] = [];
      if (pexelsRes.ok) {
        const pexelsData = await pexelsRes.json();
        stockVideos = (pexelsData.videos || []).map((v: any) => ({
          url: v.video_files?.[0]?.link || "",
          image: v.image || "",
        }));
      }
      setProgress(70);

      // Step 3: Save to database (70-90%)
      setProgressText("💾 Saving project...");
      
      if (SUPABASE_URL && SUPABASE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/render_jobs`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "video",
            status: "completed",
            progress: 100,
            payload: { script, voice_id: selectedVoice, template, resolution, aspectRatio },
            output_url: stockVideos[0]?.url || audioUrl,
          }),
        });
      }
      setProgress(90);

      // Step 4: Complete (90-100%)
      setProgressText("✅ Complete!");
      setProgress(100);

      setResult({
        audioUrl,
        stockVideos,
        script,
      });

    } catch (e: any) {
      setError(e.message);
      setProgress(0);
    } finally {
      setGenerating(false);
      setProgressText("");
    }
  }

  function getProgressColor(p: number) {
    if (p < 30) return "#ef4444";
    if (p < 70) return "#f59e0b";
    return "#4ade80";
  }

  const inputStyle = {
    width: "100%",
    padding: isMobile ? "10px" : "12px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "white",
    fontSize: isMobile ? "14px" : "16px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#bbb",
    fontSize: isMobile ? "13px" : "14px",
  };

  const cardStyle = {
    padding: isMobile ? "16px" : "20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    border: "1px solid #333",
    marginBottom: isMobile ? "16px" : "20px",
  };

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <a href="/studio" style={{ color: "#888", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>
        ← Back to Studio
      </a>
      
      <h1 style={{ fontSize: isMobile ? "28px" : "42px", fontWeight: "bold", marginTop: "16px", marginBottom: "8px" }}>
        🎬 Video Creator
      </h1>
      <p style={{ color: "#888", marginBottom: isMobile ? "24px" : "32px", fontSize: isMobile ? "14px" : "16px" }}>
        Generate videos with AI voiceover and stock footage
      </p>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#7f1d1d", borderRadius: "8px", marginBottom: "20px" }}>
          <p style={{ color: "#fca5a5", margin: 0, fontSize: "14px" }}>❌ {error}</p>
        </div>
      )}

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 400px", 
        gap: isMobile ? "16px" : "32px" 
      }}>
        
        {/* Left Column - Creation Form */}
        <div>
          {/* Voice Selection */}
          <div style={cardStyle}>
            <label style={labelStyle}>Voice ({voices.length} available)</label>
            <select 
              value={selectedVoice} 
              onChange={(e) => setSelectedVoice(e.target.value)} 
              style={inputStyle}
            >
              {voices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.name} ({v.category})
                </option>
              ))}
            </select>
          </div>

          {/* Template & Settings */}
          <div style={cardStyle}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", 
              gap: "12px" 
            }}>
              <div>
                <label style={labelStyle}>Template</label>
                <select value={template} onChange={(e) => setTemplate(e.target.value)} style={inputStyle}>
                  <option value="commercial">Commercial</option>
                  <option value="explainer">Explainer</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Resolution</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={inputStyle}>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
                <label style={labelStyle}>Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={inputStyle}>
                  <option value="16:9">16:9 (YouTube)</option>
                  <option value="9:16">9:16 (TikTok)</option>
                  <option value="1:1">1:1 (Instagram)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Script */}
          <div style={cardStyle}>
            <label style={labelStyle}>Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your video script here... The AI will generate voice narration and find matching stock footage."
              rows={isMobile ? 5 : 6}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: isMobile ? "120px" : "150px",
              }}
            />
            <p style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>
              {script.length} chars
            </p>
          </div>

          {/* Options */}
          <div style={cardStyle}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#bbb", fontSize: isMobile ? "13px" : "14px" }}>
              <input
                type="checkbox"
                checked={addCaptions}
                onChange={(e) => setAddCaptions(e.target.checked)}
                style={{ marginRight: "8px", width: "18px", height: "18px" }}
              />
              Auto Captions (coming soon)
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateVideo}
            disabled={generating || !selectedVoice}
            style={{
              width: "100%",
              padding: isMobile ? "14px" : "16px",
              backgroundColor: generating ? "#333" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "600",
              cursor: generating ? "wait" : "pointer",
            }}
          >
            {generating ? "⏳ Generating..." : "🚀 Generate Video"}
          </button>
        </div>

        {/* Right Column - Preview & Progress */}
        <div>
          {/* Progress */}
          {generating && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 12px", color: "white", fontSize: isMobile ? "16px" : "18px" }}>⏳ Progress</h3>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "12px" }}>{progressText}</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#888", fontSize: "14px" }}>Processing...</span>
                <span style={{ color: getProgressColor(progress), fontWeight: "600" }}>{progress}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "#333", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: getProgressColor(progress),
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <>
              {/* Audio Player */}
              <div style={{ ...cardStyle, backgroundColor: "#1f3a2f", borderColor: "#4ade80" }}>
                <h3 style={{ margin: "0 0 12px", color: "#4ade80", fontSize: isMobile ? "16px" : "18px" }}>
                  🎙️ Generated Voiceover
                </h3>
                <audio controls src={result.audioUrl} style={{ width: "100%" }} />
                <a
                  href={result.audioUrl}
                  download={`voiceover_${Date.now()}.mp3`}
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                    padding: "10px 16px",
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

              {/* Stock Videos */}
              {result.stockVideos.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={{ margin: "0 0 12px", color: "white", fontSize: isMobile ? "16px" : "18px" }}>
                    🎬 Stock Footage ({result.stockVideos.length})
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {result.stockVideos.map((v, i) => (
                      <a
                        key={i}
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          aspectRatio: "16/9",
                          backgroundColor: "#0a0a0a",
                          borderRadius: "6px",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={v.image}
                          alt={`Stock ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </a>
                    ))}
                  </div>
                  <p style={{ color: "#888", fontSize: "12px", marginTop: "12px" }}>
                    Click thumbnails to download stock videos from Pexels
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div style={{ ...cardStyle, backgroundColor: "#1a1a1a" }}>
                <h3 style={{ margin: "0 0 12px", color: "#f59e0b", fontSize: isMobile ? "16px" : "18px" }}>
                  📋 Next Steps
                </h3>
                <ol style={{ color: "#888", fontSize: "14px", paddingLeft: "20px", lineHeight: "1.8", margin: 0 }}>
                  <li>Download the voiceover audio above</li>
                  <li>Click stock footage thumbnails to get videos</li>
                  <li>Combine in your video editor (CapCut, Premiere, etc.)</li>
                  <li>Add captions using auto-caption tools</li>
                </ol>
              </div>
            </>
          )}

          {/* No result yet */}
          {!generating && !result && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 12px", color: "white", fontSize: isMobile ? "16px" : "18px" }}>🎬 Preview</h3>
              <div style={{
                width: "100%",
                aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "1:1" ? "1/1" : "16/9",
                backgroundColor: "#0a0a0a",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxHeight: "200px",
              }}>
                <div style={{ textAlign: "center", color: "#444" }}>
                  <p style={{ fontSize: "48px", margin: 0 }}>🎬</p>
                  <p style={{ fontSize: "12px", marginTop: "8px" }}>Enter script & generate</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
