"use client";
import { useEffect, useState } from "react";
import { useResponsive } from "../../../lib/useResponsive";

interface Job {
  id: string;
  type: string;
  status: string;
  progress?: number;
  payload: any;
  result_url?: string;
  output_url?: string;
  error?: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { isMobile, isTablet } = useResponsive();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

  async function loadJobs() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setLoading(false);
      return;
    }
    try {
      let url = `${SUPABASE_URL}/rest/v1/render_jobs?select=*&order=created_at.desc&limit=50`;
      if (filter !== "all") {
        url += `&status=eq.${filter}`;
      }
      const r = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
      const data = await r.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadJobs error", e);
    } finally {
      setLoading(false);
    }
  }

  const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
  const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

  // Process a job - generates real output based on job type
  async function processJob(jobId: string) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    setProcessing(jobId);
    
    // Update to processing
    await fetch(`${SUPABASE_URL}/rest/v1/render_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "processing", progress: 0 }),
    });
    loadJobs();

    try {
      let outputUrl = "";
      
      if (job.type === "voice") {
        // Voice job - use ElevenLabs
        await updateProgress(jobId, 20);
        
        if (ELEVENLABS_API_KEY) {
          const text = job.payload?.text || job.payload?.script || "Hello, this is a test voice generation.";
          const voiceId = job.payload?.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice
          
          await updateProgress(jobId, 40);
          
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: text.slice(0, 2500),
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          });
          
          await updateProgress(jobId, 70);
          
          if (response.ok) {
            const audioBlob = await response.blob();
            outputUrl = URL.createObjectURL(audioBlob);
          }
        }
        await updateProgress(jobId, 90);
        
      } else if (job.type === "video") {
        // Video job - fetch stock video from Pexels
        await updateProgress(jobId, 30);
        
        if (PEXELS_API_KEY) {
          const query = job.payload?.prompt || job.payload?.topic || "nature";
          const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1`, {
            headers: { Authorization: PEXELS_API_KEY },
          });
          const data = await res.json();
          
          await updateProgress(jobId, 60);
          
          if (data.videos?.[0]?.video_files?.[0]?.link) {
            outputUrl = data.videos[0].video_files[0].link;
          }
        }
        await updateProgress(jobId, 90);
        
      } else if (job.type === "avatar") {
        // Avatar job - generate via OpenAI DALL-E
        await updateProgress(jobId, 20);
        
        if (OPENAI_API_KEY) {
          const name = job.payload?.name || "character";
          const style = job.payload?.style || "realistic";
          const pixarMode = job.payload?.pixarMode;
          const bodyType = job.payload?.body?.bodyType || "average";
          const outfit = job.payload?.wardrobe?.outfit || "casual";
          
          // Build a detailed prompt based on the job payload
          let prompt = "";
          if (pixarMode) {
            prompt = `A high-quality 3D Pixar-style animated character portrait of "${name}". The character has a ${bodyType} body type, wearing ${outfit} clothing. Pixar animation style, vibrant colors, expressive features, studio lighting, 4K quality, professional 3D render.`;
          } else if (style === "anime") {
            prompt = `A beautiful anime-style character portrait of "${name}". ${bodyType} body type, wearing ${outfit} clothing. High quality anime art, detailed, vibrant colors, professional illustration.`;
          } else if (style === "cartoon") {
            prompt = `A cartoon-style character portrait of "${name}". ${bodyType} body type, wearing ${outfit} clothing. Fun cartoon style, bold colors, expressive, professional illustration.`;
          } else {
            prompt = `A photorealistic portrait of a person named "${name}". ${bodyType} body type, wearing ${outfit} clothing. Professional photography, studio lighting, high detail, 4K quality.`;
          }
          
          await updateProgress(jobId, 40);
          
          const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: prompt,
              n: 1,
              size: "1024x1024",
              quality: "hd",
            }),
          });
          
          await updateProgress(jobId, 70);
          
          const data = await response.json();
          
          if (data.data?.[0]?.url) {
            outputUrl = data.data[0].url;
          } else if (data.error) {
            console.error("DALL-E error:", data.error);
            throw new Error(data.error.message || "Image generation failed");
          }
          
          await updateProgress(jobId, 90);
        } else {
          throw new Error("OpenAI API key not configured");
        }
      }

      // Complete with output URL
      await fetch(`${SUPABASE_URL}/rest/v1/render_jobs?id=eq.${jobId}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "completed", 
          progress: 100,
          output_url: outputUrl || null
        }),
      });
      
    } catch (error: any) {
      console.error("Processing error:", error);
      await fetch(`${SUPABASE_URL}/rest/v1/render_jobs?id=eq.${jobId}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "error", 
          error: error.message || "Processing failed"
        }),
      });
    }
    
    setProcessing(null);
    loadJobs();
  }

  async function updateProgress(jobId: string, progress: number) {
    await fetch(`${SUPABASE_URL}/rest/v1/render_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    loadJobs();
    await new Promise(r => setTimeout(r, 500));
  }

  // Submit to gallery
  async function submitToGallery(job: Job) {
    if (!job.output_url) {
      alert("No output to submit");
      return;
    }
    
    const galleryItem = {
      job_id: job.id,
      type: job.type,
      output_url: job.output_url,
      title: job.payload?.name || job.payload?.prompt || `${job.type} creation`,
      submitted_at: new Date().toISOString(),
      user_id: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).username : "anonymous",
    };
    
    // Save to localStorage gallery (in production, save to Supabase)
    const existing = JSON.parse(localStorage.getItem("gallery_submissions") || "[]");
    existing.push(galleryItem);
    localStorage.setItem("gallery_submissions", JSON.stringify(existing));
    
    alert("✅ Submitted to Gallery!");
  }

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return "#4ade80";
      case "processing": return "#f59e0b";
      case "queued": return "#3b82f6";
      case "error": return "#ef4444";
      default: return "#888";
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "voice": return "🎤";
      case "avatar": return "👤";
      case "video": return "🎬";
      default: return "📄";
    }
  }

  // Generate a proper display name for the job like "Avatar: Rena" or "Video: School Bus Ride"
  function getJobDisplayName(job: Job) {
    const type = job.type.charAt(0).toUpperCase() + job.type.slice(1);
    
    // Extract name from payload based on job type
    let name = "";
    if (job.payload) {
      if (job.type === "avatar") {
        name = job.payload.name || job.payload.avatarName || "";
      } else if (job.type === "voice") {
        name = job.payload.voiceName || job.payload.name || "";
        // If no name but has text, use first few words
        if (!name && job.payload.text) {
          name = job.payload.text.slice(0, 30).split(" ").slice(0, 4).join(" ");
          if (job.payload.text.length > 30) name += "...";
        }
        if (!name && job.payload.script) {
          name = job.payload.script.slice(0, 30).split(" ").slice(0, 4).join(" ");
          if (job.payload.script.length > 30) name += "...";
        }
      } else if (job.type === "video") {
        name = job.payload.title || job.payload.topic || job.payload.prompt || "";
        if (name.length > 35) name = name.slice(0, 35) + "...";
      }
    }
    
    if (name) {
      return `${type}: ${name}`;
    }
    return type;
  }

  const cardStyle = {
    padding: isMobile ? "16px" : "20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    border: "1px solid #333",
  };

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <a href="/studio" style={{ color: "#888", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>
        ← Back to Studio
      </a>
      
      <h1 style={{ fontSize: isMobile ? "28px" : "42px", fontWeight: "bold", marginTop: "16px", marginBottom: "8px" }}>
        📁 Projects
      </h1>
      <p style={{ color: "#888", marginBottom: isMobile ? "20px" : "30px", fontSize: isMobile ? "14px" : "16px" }}>
        View and manage your render jobs
      </p>

      {/* Filter Buttons */}
      <div style={{ 
        display: "flex", 
        gap: isMobile ? "8px" : "10px", 
        marginBottom: isMobile ? "20px" : "30px", 
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        {["all", "queued", "processing", "completed", "error"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: isMobile ? "6px 12px" : "8px 16px",
              backgroundColor: filter === f ? "#2563eb" : "#1a1a1a",
              color: "white",
              border: "1px solid #333",
              borderRadius: "6px",
              cursor: "pointer",
              textTransform: "capitalize",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            {f}
          </button>
        ))}
        
        <button
          onClick={loadJobs}
          style={{
            padding: isMobile ? "6px 12px" : "8px 16px",
            backgroundColor: "#1a1a1a",
            color: "#888",
            border: "1px solid #333",
            borderRadius: "6px",
            cursor: "pointer",
            marginLeft: isMobile ? "0" : "auto",
            fontSize: isMobile ? "13px" : "14px",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#888" }}>Loading...</p>
      ) : jobs.length === 0 ? (
        <div style={{ 
          padding: isMobile ? "40px 20px" : "60px", 
          textAlign: "center", 
          backgroundColor: "#1a1a1a", 
          borderRadius: "12px", 
          border: "1px solid #333" 
        }}>
          <p style={{ fontSize: isMobile ? "36px" : "48px", marginBottom: "16px" }}>📭</p>
          <p style={{ color: "#888", fontSize: isMobile ? "16px" : "18px" }}>No jobs found</p>
          <p style={{ color: "#666", fontSize: isMobile ? "13px" : "14px", marginTop: "8px" }}>
            Create a job from Voice, Avatar, or Video pages
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {jobs.map((job) => (
            <div key={job.id} style={cardStyle}>
              {/* Mobile Layout */}
              {isMobile ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "28px" }}>{getTypeIcon(job.type)}</span>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>{getJobDisplayName(job)}</div>
                        <div style={{ color: "#666", fontSize: "12px" }}>#{job.id?.slice(0, 8)}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        backgroundColor: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status),
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        textTransform: "capitalize",
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  
                  <div style={{ color: "#888", fontSize: "12px", marginBottom: "12px" }}>
                    {new Date(job.created_at).toLocaleString()}
                  </div>

                  {job.error && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>
                      Error: {job.error}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {job.status === "processing" && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#888", fontSize: "11px" }}>Processing...</span>
                        <span style={{ color: "#f59e0b", fontSize: "11px" }}>{job.progress || 0}%</span>
                      </div>
                      <div style={{ width: "100%", height: "4px", backgroundColor: "#333", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{
                          width: `${job.progress || 0}%`,
                          height: "100%",
                          backgroundColor: "#f59e0b",
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {job.status === "queued" && (
                    <button
                      onClick={() => processJob(job.id)}
                      disabled={processing === job.id}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px",
                        backgroundColor: processing === job.id ? "#333" : "#16a34a",
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "14px",
                        textAlign: "center",
                        fontWeight: "500",
                        border: "none",
                        cursor: processing === job.id ? "wait" : "pointer",
                      }}
                    >
                      {processing === job.id ? "⏳ Processing..." : "▶️ Process Now"}
                    </button>
                  )}
                  {(job.output_url || job.result_url) && (
                    <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                      <a
                        href={job.output_url || job.result_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px",
                          backgroundColor: "#2563eb",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "14px",
                          textAlign: "center",
                          fontWeight: "500",
                        }}
                      >
                        ⬇️ Download
                      </a>
                      <button
                        onClick={() => submitToGallery(job)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px",
                          backgroundColor: "#8b5cf6",
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "14px",
                          textAlign: "center",
                          fontWeight: "500",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        🖼️ Submit to Gallery
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout */
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <span style={{ fontSize: "32px" }}>{getTypeIcon(job.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "bold" }}>{getJobDisplayName(job)}</span>
                        <span style={{ color: "#666", fontSize: "14px" }}>#{job.id?.slice(0, 8)}</span>
                      </div>
                      <div style={{ color: "#888", fontSize: "14px" }}>
                        {new Date(job.created_at).toLocaleString()}
                      </div>
                      {job.error && (
                        <div style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px" }}>
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        padding: "6px 12px",
                        backgroundColor: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status),
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "500",
                        textTransform: "capitalize",
                      }}
                    >
                      {job.status}
                    </span>
                    {job.status === "queued" && (
                      <button
                        onClick={() => processJob(job.id)}
                        disabled={processing === job.id}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: processing === job.id ? "#333" : "#16a34a",
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "14px",
                          border: "none",
                          cursor: processing === job.id ? "wait" : "pointer",
                        }}
                      >
                        {processing === job.id ? "⏳ Processing..." : "▶️ Process"}
                      </button>
                    )}
                    {(job.output_url || job.result_url) && (
                      <>
                        <a
                          href={job.output_url || job.result_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#2563eb",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "14px",
                          }}
                        >
                          ⬇️ Download
                        </a>
                        <button
                          onClick={() => submitToGallery(job)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#8b5cf6",
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "14px",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          🖼️ Gallery
                        </button>
                      </>
                    )}
                  </div>
                  
                  {job.status === "processing" && (
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#888", fontSize: "12px" }}>Processing...</span>
                        <span style={{ color: "#f59e0b", fontSize: "12px" }}>{job.progress || 0}%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#333", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          width: `${job.progress || 0}%`,
                          height: "100%",
                          backgroundColor: "#f59e0b",
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Guide - simplified on mobile */}
      <div style={{ 
        marginTop: isMobile ? "32px" : "48px", 
        padding: isMobile ? "16px" : "20px", 
        backgroundColor: "#1a1a1a", 
        borderRadius: "8px", 
        border: "1px solid #333" 
      }}>
        <h3 style={{ fontSize: isMobile ? "16px" : "18px", marginBottom: isMobile ? "12px" : "16px" }}>
          Status Guide
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
          gap: isMobile ? "8px" : "10px", 
          color: "#888",
          fontSize: isMobile ? "13px" : "14px"
        }}>
          <div><span style={{ color: "#3b82f6" }}>● Queued</span> — Waiting</div>
          <div><span style={{ color: "#f59e0b" }}>● Processing</span> — Rendering</div>
          <div><span style={{ color: "#4ade80" }}>● Completed</span> — Ready</div>
          <div><span style={{ color: "#ef4444" }}>● Error</span> — Failed</div>
        </div>
      </div>
    </main>
  );
}
