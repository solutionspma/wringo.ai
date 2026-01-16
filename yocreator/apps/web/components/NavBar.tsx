"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useResponsive } from "../lib/useResponsive";

export default function NavBar() {
  const { user, logout: authLogout, isAuthenticated } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // On landing page, only show logo and login
  const isLandingPage = pathname === "/";

  function logout() {
    authLogout();
    window.location.href = "/";
  }

  // Close mobile menu when screen resizes
  useEffect(() => {
    if (!isMobile && !isTablet) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, isTablet]);

  const navLinks = [
    { href: "/studio", label: "Studio" },
    { href: "/studio/voice", label: "Voice" },
    { href: "/studio/avatarEngine", label: "Avatar" },
    { href: "/studio/video", label: "Video" },
    { href: "/studio/projects", label: "Projects" },
    { href: "/gallery", label: "Gallery" },
  ];

  return (
    <nav style={{
      backgroundColor: "#0a0a0a",
      borderBottom: "1px solid #222",
      padding: isMobile ? "0 16px" : "0 40px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: isMobile ? "60px" : "70px",
      }}>
        {/* Logo - goes to /studio if logged in, / if not */}
        <Link href={isAuthenticated ? "/studio" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: isMobile ? "24px" : "28px" }}>🎬</span>
          <span style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "bold", color: "white" }}>YOcreator</span>
        </Link>

        {/* Desktop Nav - hidden on landing page */}
        {!isMobile && !isTablet && !isLandingPage && (
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={navLinkStyle}>{link.label}</Link>
            ))}
            {user?.role === "genesis" && (
              <Link href="/admin" style={{ ...navLinkStyle, color: "#f59e0b" }}>👑 Admin</Link>
            )}
          </div>
        )}

        {/* Desktop User Menu */}
        {!isMobile && !isTablet && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {user ? (
              <>
                <Link href="/settings" style={navLinkStyle}>⚙️</Link>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: user.role === "genesis" ? "#f59e0b" : "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                    }}>
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                    <span style={{ fontSize: "14px" }}>{user.username}</span>
                  </button>
                  {menuOpen && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      minWidth: "140px",
                      overflow: "hidden",
                    }}>
                      <Link href="/settings" style={dropdownItemStyle}>Settings</Link>
                      <button onClick={logout} style={{ ...dropdownItemStyle, border: "none", width: "100%", textAlign: "left", color: "#ef4444" }}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" style={{
                padding: "10px 20px",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}>
                Sign In
              </Link>
            )}
          </div>
        )}

        {/* Mobile/Tablet Hamburger - hidden on landing page */}
        {(isMobile || isTablet) && !isLandingPage && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: "8px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <span style={{ width: "24px", height: "2px", backgroundColor: "#fff", transition: "all 0.2s" }} />
            <span style={{ width: "24px", height: "2px", backgroundColor: "#fff", transition: "all 0.2s" }} />
            <span style={{ width: "24px", height: "2px", backgroundColor: "#fff", transition: "all 0.2s" }} />
          </button>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {(isMobile || isTablet) && mobileMenuOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid #333",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 16px",
                color: "#ddd",
                textDecoration: "none",
                fontSize: "16px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
              }}
            >
              {link.label}
            </Link>
          ))}
          
          {user?.role === "genesis" && (
            <Link 
              href="/admin" 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 16px",
                color: "#f59e0b",
                textDecoration: "none",
                fontSize: "16px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
              }}
            >
              👑 Admin
            </Link>
          )}
          
          <div style={{ height: "1px", backgroundColor: "#333", margin: "8px 0" }} />
          
          {user ? (
            <>
              <Link 
                href="/settings" 
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  color: "#ddd",
                  textDecoration: "none",
                  fontSize: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#1a1a1a",
                }}
              >
                ⚙️ Settings
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  color: "#ef4444",
                  textDecoration: "none",
                  fontSize: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#1a1a1a",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 16px",
                color: "white",
                textDecoration: "none",
                fontSize: "16px",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                textAlign: "center",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: "#888",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
};

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  padding: "12px 16px",
  color: "#bbb",
  textDecoration: "none",
  fontSize: "14px",
  borderBottom: "1px solid #222",
  backgroundColor: "transparent",
  cursor: "pointer",
};
