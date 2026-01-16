"use client";
import Link from "next/link";
import { useResponsive } from "../lib/useResponsive";

export default function Footer() {
  const { isMobile, isTablet } = useResponsive();

  const footerLinkStyle: React.CSSProperties = {
    color: "#666",
    textDecoration: "none",
    fontSize: isMobile ? "13px" : "14px",
    transition: "color 0.2s",
  };

  return (
    <footer style={{
      backgroundColor: "#0a0a0a",
      borderTop: "1px solid #222",
      padding: isMobile ? "24px 16px" : "40px",
      marginTop: "auto",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: isMobile ? "20px" : "40px",
      }}>
        {/* Brand - full width on mobile */}
        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: isMobile ? "20px" : "24px" }}>🎬</span>
            <span style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "bold" }}>YOcreator</span>
          </div>
          <p style={{ color: "#666", fontSize: isMobile ? "13px" : "14px", lineHeight: "1.6", margin: 0 }}>
            AI-powered voice cloning, avatar creation, and video generation platform.
          </p>
        </div>

        {/* Studio */}
        <div>
          <h4 style={{ fontSize: isMobile ? "11px" : "14px", fontWeight: "600", color: "#888", margin: 0, marginBottom: isMobile ? "10px" : "16px" }}>STUDIO</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "12px" }}>
            <Link href="/studio/voice" style={footerLinkStyle}>Voice Generator</Link>
            <Link href="/studio/avatar" style={footerLinkStyle}>Avatar Builder</Link>
            <Link href="/studio/video" style={footerLinkStyle}>Video Creator</Link>
            <Link href="/studio/projects" style={footerLinkStyle}>My Projects</Link>
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 style={{ fontSize: isMobile ? "11px" : "14px", fontWeight: "600", color: "#888", margin: 0, marginBottom: isMobile ? "10px" : "16px" }}>PLATFORM</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "12px" }}>
            <Link href="/settings" style={footerLinkStyle}>Settings</Link>
            <Link href="/admin" style={footerLinkStyle}>Admin Dashboard</Link>
            <Link href="/studio/test" style={footerLinkStyle}>API Test Center</Link>
            <a href="#" style={footerLinkStyle}>Web3 Integration</a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontSize: isMobile ? "11px" : "14px", fontWeight: "600", color: "#888", margin: 0, marginBottom: isMobile ? "10px" : "16px" }}>COMPANY</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "12px" }}>
            <a href="#" style={footerLinkStyle}>About</a>
            <a href="#" style={footerLinkStyle}>Pricing</a>
            <a href="#" style={footerLinkStyle}>Privacy Policy</a>
            <a href="#" style={footerLinkStyle}>Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: "1400px",
        margin: isMobile ? "20px auto 0" : "40px auto 0",
        paddingTop: isMobile ? "16px" : "24px",
        borderTop: "1px solid #222",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "center" : "center",
        gap: isMobile ? "8px" : "0",
        textAlign: isMobile ? "center" : "left",
      }}>
        <p style={{ color: "#666", fontSize: isMobile ? "11px" : "14px", margin: 0 }}>
          © 2025 Pitch Marketing Agency. All rights reserved.
        </p>
        <span style={{ color: "#666", fontSize: isMobile ? "11px" : "14px" }}>Powered by $MODULAR</span>
      </div>
    </footer>
  );
}
