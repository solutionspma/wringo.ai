"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useResponsive } from "../../lib/useResponsive";
import { useAuth } from "../../lib/AuthContext";

interface Stats {
  voices: number | string;
  avatars: number | string;
  videos: number | string;
  elevenLabsCredits: number | string;
  openAiCredits: number | string;
  runpodCredits: number | string;
}

export default function Studio() {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const isGenesis = user?.role === "genesis";
  
  const [stats, setStats] = useState<Stats>({
    voices: "...",
    avatars: "...",
    videos: "...",
    elevenLabsCredits: "...",
    openAiCredits: "...",
    runpodCredits: "...",
  });
  const [loading, setLoading] = useState(true);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
  const ELEVENLABS_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
  const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

  useEffect(() => {
    async function loadStats() {
      const newStats: Stats = {
        voices: "N/A",
        avatars: "N/A",
        videos: "N/A",
        elevenLabsCredits: "N/A",
        openAiCredits: "N/A",
        runpodCredits: "10,000", // RunPod doesn't have a simple API for credits
      };

      // Count jobs from Supabase
      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const [voiceRes, avatarRes, videoRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/render_jobs?type=eq.voice&status=eq.completed&select=id`, { 
              headers: { apikey: SUPABASE_KEY } 
            }),
            fetch(`${SUPABASE_URL}/rest/v1/render_jobs?type=eq.avatar&status=eq.completed&select=id`, { 
              headers: { apikey: SUPABASE_KEY } 
            }),
            fetch(`${SUPABASE_URL}/rest/v1/render_jobs?type=eq.video&status=eq.completed&select=id`, { 
              headers: { apikey: SUPABASE_KEY } 
            }),
          ]);
          
          if (voiceRes.ok) {
            const data = await voiceRes.json();
            newStats.voices = Array.isArray(data) ? data.length : 0;
          }
          if (avatarRes.ok) {
            const data = await avatarRes.json();
            newStats.avatars = Array.isArray(data) ? data.length : 0;
          }
          if (videoRes.ok) {
            const data = await videoRes.json();
            newStats.videos = Array.isArray(data) ? data.length : 0;
          }
        } catch (e) {
          console.error("Failed to load job counts:", e);
        }
      }

      // Get ElevenLabs subscription info
      if (ELEVENLABS_KEY) {
        try {
          const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
            headers: { "xi-api-key": ELEVENLABS_KEY },
          });
          if (res.ok) {
            const data = await res.json();
            const remaining = data.character_limit - data.character_count;
            newStats.elevenLabsCredits = remaining.toLocaleString();
          }
        } catch (e) {
          console.error("Failed to load ElevenLabs credits:", e);
        }
      }

      // OpenAI doesn't have a simple credits API for project keys
      // We mark it as N/A since usage is billed monthly
      if (OPENAI_KEY) {
        newStats.openAiCredits = "Active";
      }

      setStats(newStats);
      setLoading(false);
    }

    loadStats();
  }, [SUPABASE_URL, SUPABASE_KEY, ELEVENLABS_KEY, OPENAI_KEY]);

  const tools = [
    { 
      href: "/studio/voice", 
      icon: "🎙️", 
      title: "Voice Generator", 
      desc: "Clone voices & generate AI speech",
      color: "#4ade80"
    },
    { 
      href: "/studio/avatar", 
      icon: "👤", 
      title: "Avatar Builder", 
      desc: "Create custom 3D AI avatars",
      color: "#7c3aed"
    },
    { 
      href: "/studio/video", 
      icon: "🎬", 
      title: "Video Creator", 
      desc: "Generate AI-powered videos",
      color: "#3b82f6"
    },
    { 
      href: "/studio/projects", 
      icon: "📁", 
      title: "My Projects", 
      desc: "View all your renders & exports",
      color: "#f59e0b"
    },
  ];

  return (
    <main style={{ 
      padding: isMobile ? "20px" : "40px", 
      maxWidth: "1200px", 
      margin: "0 auto" 
    }}>
      <div style={{ marginBottom: isMobile ? "24px" : "40px" }}>
        <h1 style={{ 
          fontSize: isMobile ? "32px" : "48px", 
          fontWeight: "bold", 
          marginBottom: "8px",
          background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          🎨 Creator Studio
        </h1>
        <p style={{ color: "#888", fontSize: isMobile ? "14px" : "16px" }}>
          Choose a tool to start creating
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4, 1fr)", 
        gap: isMobile ? "16px" : "24px" 
      }}>
        {tools.map((tool) => (
          <Link 
            key={tool.href} 
            href={tool.href}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              padding: isMobile ? "20px" : "24px",
              backgroundColor: "#1a1a1a",
              borderRadius: "12px",
              border: "1px solid #333",
              cursor: "pointer",
              transition: "all 0.2s ease",
              height: "100%",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = tool.color;
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#333";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            >
              <div style={{ 
                fontSize: isMobile ? "40px" : "48px", 
                marginBottom: "12px" 
              }}>
                {tool.icon}
              </div>
              <h3 style={{ 
                color: "white", 
                fontSize: isMobile ? "18px" : "20px", 
                fontWeight: "600", 
                marginBottom: "8px" 
              }}>
                {tool.title}
              </h3>
              <p style={{ 
                color: "#888", 
                fontSize: isMobile ? "13px" : "14px", 
                margin: 0,
                lineHeight: 1.4
              }}>
                {tool.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={{ 
        marginTop: isMobile ? "32px" : "48px",
        padding: isMobile ? "16px" : "24px",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        border: "1px solid #333"
      }}>
        <h3 style={{ 
          color: "white", 
          fontSize: isMobile ? "16px" : "18px", 
          marginBottom: "16px" 
        }}>
          📊 Quick Stats
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", 
          gap: isMobile ? "12px" : "16px" 
        }}>
          {[
            { label: "Voices Created", value: stats.voices, icon: "🎙️" },
            { label: "Avatars Created", value: stats.avatars, icon: "👤" },
            { label: "Videos Created", value: stats.videos, icon: "🎬" },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: isMobile ? "12px" : "16px",
              backgroundColor: "#0a0a0a",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <p style={{ fontSize: isMobile ? "20px" : "24px", margin: "0 0 4px" }}>{stat.icon}</p>
              <p style={{ 
                color: "white", 
                fontSize: isMobile ? "20px" : "24px", 
                fontWeight: "bold", 
                margin: "0 0 2px" 
              }}>
                {loading ? "..." : stat.value}
              </p>
              <p style={{ 
                color: "#666", 
                fontSize: isMobile ? "11px" : "12px", 
                margin: 0 
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* API Credits - Only visible to Genesis admin */}
        {isGenesis && (
          <>
            <h4 style={{ 
              color: "#888", 
              fontSize: isMobile ? "14px" : "16px", 
              marginTop: "24px",
              marginBottom: "12px" 
            }}>
              💳 API Credits (Admin Only)
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", 
              gap: isMobile ? "8px" : "12px" 
            }}>
              {[
                { label: "ElevenLabs (chars)", value: stats.elevenLabsCredits, color: "#4ade80" },
                { label: "OpenAI", value: stats.openAiCredits, color: "#60a5fa" },
                { label: "RunPod (credits)", value: stats.runpodCredits, color: "#f59e0b" },
              ].map((credit) => (
                <div key={credit.label} style={{
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  backgroundColor: "#0a0a0a",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{ color: "#888", fontSize: isMobile ? "12px" : "13px" }}>{credit.label}</span>
                  <span style={{ 
                    color: credit.value === "N/A" ? "#666" : credit.color, 
                    fontSize: isMobile ? "14px" : "15px",
                    fontWeight: "600"
                  }}>
                    {loading ? "..." : credit.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
