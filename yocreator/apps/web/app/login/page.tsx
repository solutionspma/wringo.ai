"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  
  // Get redirect URL from query params (set by ProtectedRoute)
  const redirectUrl = searchParams.get("redirect") || "/studio";

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Genesis master account check
    if (username === "masteracct" && password === "Number79-2025") {
      login({ username, role: "genesis", tier: "unlimited" });
      router.push("/admin");
      return;
    }

    // Beta tester account - full access like master but as regular user
    if (username === "YCbeta1" && password === "Tester2025") {
      login({ 
        username, 
        role: "beta_tester", 
        tier: "unlimited",
        features: ["avatar", "voice", "video", "projects", "gallery", "settings"]
      });
      router.push("/studio");
      return;
    }

    // Regular user auth via Supabase
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${username}&select=*`, {
          headers: { apikey: SUPABASE_KEY },
        });
        const users = await res.json();
        if (users.length > 0 && users[0].password === password) {
          login(users[0]);
          router.push(redirectUrl);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setError("Invalid username or password");
    setLoading(false);
  }

  return (
    <main style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "40px"
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "400px", 
        backgroundColor: "#1a1a1a", 
        padding: "40px", 
        borderRadius: "16px",
        border: "1px solid #333"
      }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>
          YOcreator
        </h1>
        <p style={{ color: "#888", textAlign: "center", marginBottom: "32px" }}>
          Sign in to your account
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#0f0f0f",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#0f0f0f",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>

          {error && (
            <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <a href="/" style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}>
            ← Back to Home
          </a>
        </div>

        <div style={{ 
          marginTop: "32px", 
          paddingTop: "24px", 
          borderTop: "1px solid #333", 
          textAlign: "center" 
        }}>
          <p style={{ color: "#666", fontSize: "12px" }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color: "#2563eb" }}>Sign up</a>
          </p>
        </div>
      </div>
    </main>
  );
}
