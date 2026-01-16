"use client";
import { useState, useEffect } from "react";
import { useResponsive } from "../../lib/useResponsive";

interface GalleryItem {
  job_id: string;
  type: string;
  output_url: string;
  title: string;
  submitted_at: string;
  user_id: string;
}

export default function GalleryPage() {
  const { isMobile, isTablet } = useResponsive();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  function loadGallery() {
    const saved = localStorage.getItem("gallery_submissions");
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }

  function deleteItem(jobId: string) {
    if (!confirm("Remove from gallery?")) return;
    const updated = items.filter(i => i.job_id !== jobId);
    setItems(updated);
    localStorage.setItem("gallery_submissions", JSON.stringify(updated));
  }

  const filteredItems = filter === "all" 
    ? items 
    : items.filter(i => i.type === filter);

  function getTypeIcon(type: string) {
    switch (type) {
      case "voice": return "🎤";
      case "avatar": return "👤";
      case "video": return "🎬";
      default: return "📄";
    }
  }

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}>
      <a href="/studio" style={{ color: "#888", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>
        ← Back to Studio
      </a>
      
      <h1 style={{ fontSize: isMobile ? "28px" : "48px", fontWeight: "bold", marginTop: "16px", marginBottom: "8px" }}>
        🖼️ Creator Gallery
      </h1>
      <p style={{ color: "#888", marginBottom: isMobile ? "24px" : "40px", fontSize: isMobile ? "14px" : "16px" }}>
        Community creations from YOcreator Studio
      </p>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "30px", flexWrap: "wrap" }}>
        {["all", "avatar", "video", "voice"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: isMobile ? "8px 16px" : "10px 20px",
              backgroundColor: filter === f ? "#8b5cf6" : "#1a1a1a",
              color: "white",
              border: "1px solid #333",
              borderRadius: "8px",
              cursor: "pointer",
              textTransform: "capitalize",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            {f === "all" ? "🌟 All" : `${getTypeIcon(f)} ${f}`}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div style={{ 
          padding: "80px 20px", 
          textAlign: "center", 
          backgroundColor: "#1a1a1a", 
          borderRadius: "16px",
          border: "1px solid #333"
        }}>
          <p style={{ fontSize: "64px", marginBottom: "20px" }}>🎨</p>
          <p style={{ fontSize: "20px", color: "#888", marginBottom: "10px" }}>Gallery is empty</p>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Process jobs and submit them to the gallery from the Projects page
          </p>
          <a 
            href="/studio/projects" 
            style={{ 
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 24px",
              backgroundColor: "#8b5cf6",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none"
            }}
          >
            Go to Projects →
          </a>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: isMobile ? "16px" : "24px"
        }}>
          {filteredItems.map((item) => (
            <div 
              key={item.job_id}
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: "16px",
                border: "1px solid #333",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, border-color 0.2s",
              }}
              onClick={() => setSelectedItem(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.borderColor = "#8b5cf6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "#333";
              }}
            >
              {/* Preview */}
              <div style={{ 
                aspectRatio: "16/9", 
                backgroundColor: "#0f0f0f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                {item.type === "video" ? (
                  <video 
                    src={item.output_url} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    muted
                    loop
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                ) : item.type === "avatar" ? (
                  <img 
                    src={item.output_url} 
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement!.innerHTML = `<span style="font-size:64px">👤</span>`;
                    }}
                  />
                ) : item.type === "voice" ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <span style={{ fontSize: "64px" }}>🎤</span>
                    <p style={{ color: "#888", fontSize: "14px", marginTop: "10px" }}>Audio File</p>
                  </div>
                ) : (
                  <span style={{ fontSize: "64px" }}>{getTypeIcon(item.type)}</span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{getTypeIcon(item.type)}</span>
                  <span style={{ 
                    padding: "4px 8px", 
                    backgroundColor: "#8b5cf633", 
                    color: "#8b5cf6", 
                    borderRadius: "4px",
                    fontSize: "12px",
                    textTransform: "capitalize"
                  }}>
                    {item.type}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "white" }}>{item.title}</h3>
                <p style={{ color: "#666", fontSize: "12px" }}>
                  by {item.user_id} • {new Date(item.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedItem && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div 
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "16px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview */}
            <div style={{ 
              aspectRatio: "16/9", 
              backgroundColor: "#0f0f0f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {selectedItem.type === "video" ? (
                <video 
                  src={selectedItem.output_url} 
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : selectedItem.type === "avatar" ? (
                <img 
                  src={selectedItem.output_url} 
                  alt={selectedItem.title}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              ) : selectedItem.type === "voice" ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <span style={{ fontSize: "80px" }}>🎤</span>
                  <audio src={selectedItem.output_url} controls style={{ marginTop: "20px", width: "100%" }} />
                </div>
              ) : null}
            </div>

            {/* Details */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>{selectedItem.title}</h2>
                  <p style={{ color: "#888" }}>
                    Created by {selectedItem.user_id} • {new Date(selectedItem.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span style={{ 
                  padding: "6px 12px", 
                  backgroundColor: "#8b5cf633", 
                  color: "#8b5cf6", 
                  borderRadius: "20px",
                  fontSize: "14px",
                  textTransform: "capitalize"
                }}>
                  {getTypeIcon(selectedItem.type)} {selectedItem.type}
                </span>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href={selectedItem.output_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={() => {
                    deleteItem(selectedItem.job_id);
                    setSelectedItem(null);
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#ef444433",
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  🗑️ Remove from Gallery
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#333",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
