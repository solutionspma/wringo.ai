"use client";
import { useState, useEffect } from "react";
import { useResponsive } from "../../lib/useResponsive";

interface Settings {
  email: string;
  authNetLoginId: string;
  authNetTransactionKey: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  walletAddress: string;
  modularTokenContract: string;
  nftCollectionContract: string;
  autoMintNft: boolean;
  openaiApiKey: string;
  elevenLabsApiKey: string;
  replicateApiToken: string;
  runpodApiKey: string;
  platformName: string;
  primaryColor: string;
  logoUrl: string;
  footerText: string;
}

const defaultSettings: Settings = {
  email: "",
  authNetLoginId: "",
  authNetTransactionKey: "",
  stripePublishableKey: "",
  stripeSecretKey: "",
  walletAddress: "",
  modularTokenContract: "",
  nftCollectionContract: "",
  autoMintNft: false,
  openaiApiKey: "",
  elevenLabsApiKey: "",
  replicateApiToken: "",
  runpodApiKey: "",
  platformName: "YOcreator Studio",
  primaryColor: "#2563eb",
  logoUrl: "",
  footerText: "© 2025 Pitch Marketing Agency",
};

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useResponsive();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      loadSettings(userData.id || userData.username);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadSettings(userId: string) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=*`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      const data = await res.json();
      if (data && data[0]?.settings) {
        setSettings({ ...defaultSettings, ...data[0].settings });
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(section: string) {
    if (!user) {
      setSaveStatus("Please sign in to save settings");
      return;
    }
    setSaving(true);
    setSaveStatus(null);

    try {
      const userId = user.id || user.username;
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      const existing = await checkRes.json();

      const payload = {
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString(),
      };

      let res;
      if (existing && existing.length > 0) {
        res = await fetch(
          `${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_KEY,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({ settings: settings, updated_at: new Date().toISOString() }),
          }
        );
      } else {
        res = await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setSaveStatus(`✓ ${section} saved successfully!`);
      } else {
        const error = await res.text();
        setSaveStatus(`Error: ${error}`);
      }
    } catch (e: any) {
      setSaveStatus(`Error: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const isGenesis = user?.role === "genesis";

  const tabs = [
    { id: "account", label: "Account" },
    { id: "billing", label: "Billing & Payments" },
    { id: "tiers", label: "Access Tiers", genesis: true },
    { id: "web3", label: "Web3 & NFT" },
    { id: "api", label: "API Keys" },
    { id: "cms", label: "CMS Controls", genesis: true },
  ];

  if (loading) {
    return (
      <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#888" }}>Loading settings...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <a href="/" style={{ color: "#888", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>← Back to Home</a>
      <h1 style={{ fontSize: isMobile ? "28px" : "48px", fontWeight: "bold", marginTop: "16px" }}>⚙️ Settings</h1>
      <p style={{ color: "#888", marginBottom: isMobile ? "24px" : "40px", fontSize: isMobile ? "14px" : "16px" }}>
        {isGenesis ? "Genesis Master Account - Full Platform Control" : "Manage your account settings"}
      </p>

      {/* Save Status Banner */}
      {saveStatus && (
        <div style={{
          padding: "12px 20px",
          marginBottom: "20px",
          backgroundColor: saveStatus.includes("✓") ? "#1f3a2f" : "#3a1f1f",
          border: `1px solid ${saveStatus.includes("✓") ? "#4ade80" : "#ef4444"}`,
          borderRadius: "8px",
          color: saveStatus.includes("✓") ? "#4ade80" : "#ef4444",
          fontSize: isMobile ? "14px" : "16px",
        }}>
          {saveStatus}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: isMobile ? "20px" : "30px", 
        flexWrap: "wrap",
        overflowX: isMobile ? "auto" : "visible",
      }}>
        {tabs.filter(t => !t.genesis || isGenesis).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: isMobile ? "8px 14px" : "10px 20px",
              backgroundColor: activeTab === tab.id ? "#2563eb" : "#1a1a1a",
              color: "white",
              border: "1px solid #333",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: isMobile ? "13px" : "14px",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Account Information</h2>
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Username</label>
              <input type="text" value={user?.username || ""} readOnly style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={settings.email}
                onChange={(e) => updateSetting("email", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Account Tier</label>
              <input type="text" value={user?.tier || "Free"} readOnly style={{ ...inputStyle, color: "#4ade80" }} />
            </div>
            <button onClick={() => saveSettings("Account")} disabled={saving} style={buttonStyle}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Payment Integration</h2>
          
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#bbb" }}>Authorize.net</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#888", fontSize: "14px" }}>API Login ID</label>
                <input
                  type="text"
                  placeholder="98ZaZP6zy"
                  value={settings.authNetLoginId}
                  onChange={(e) => updateSetting("authNetLoginId", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#888", fontSize: "14px" }}>Transaction Key</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={settings.authNetTransactionKey}
                  onChange={(e) => updateSetting("authNetTransactionKey", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#bbb" }}>Stripe</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#888", fontSize: "14px" }}>Publishable Key</label>
                <input
                  type="text"
                  placeholder="pk_live_..."
                  value={settings.stripePublishableKey}
                  onChange={(e) => updateSetting("stripePublishableKey", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#888", fontSize: "14px" }}>Secret Key</label>
                <input
                  type="password"
                  placeholder="sk_live_..."
                  value={settings.stripeSecretKey}
                  onChange={(e) => updateSetting("stripeSecretKey", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <button onClick={() => saveSettings("Payment Settings")} disabled={saving} style={buttonStyle}>
            {saving ? "Saving..." : "Save Payment Settings"}
          </button>
        </div>
      )}

      {/* Access Tiers Tab (Genesis Only) */}
      {activeTab === "tiers" && isGenesis && (
        <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Access Tiers & Pricing</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { name: "Free", price: "$0", features: ["5 voice generations/mo", "2 avatar renders/mo", "720p export"] },
              { name: "Pro", price: "$29", features: ["50 voice generations/mo", "20 avatar renders/mo", "1080p export", "Priority queue"] },
              { name: "Enterprise", price: "$99", features: ["Unlimited generations", "Unlimited renders", "4K export", "API access", "Dedicated support"] },
            ].map((tier) => (
              <div key={tier.name} style={{ backgroundColor: "#0f0f0f", padding: "20px", borderRadius: "8px", border: "1px solid #333" }}>
                <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>{tier.name}</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb", marginBottom: "15px" }}>{tier.price}<span style={{ fontSize: "14px", color: "#888" }}>/mo</span></p>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>✓ {f}</li>
                  ))}
                </ul>
                <button style={{ ...buttonStyle, width: "100%", marginTop: "15px", backgroundColor: "#333" }}>Edit Tier</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web3 Tab */}
      {activeTab === "web3" && (
        <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Web3 & NFT Settings</h2>
          
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={settings.walletAddress}
                onChange={(e) => updateSetting("walletAddress", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Modular Token Contract</label>
              <input
                type="text"
                placeholder="Contract address for $MODULAR"
                value={settings.modularTokenContract}
                onChange={(e) => updateSetting("modularTokenContract", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>NFT Collection Contract</label>
              <input
                type="text"
                placeholder="ERC-721 contract address"
                value={settings.nftCollectionContract}
                onChange={(e) => updateSetting("nftCollectionContract", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="autoMint"
                checked={settings.autoMintNft}
                onChange={(e) => updateSetting("autoMintNft", e.target.checked)}
              />
              <label htmlFor="autoMint" style={{ color: "#bbb" }}>Auto-mint completed renders as NFTs</label>
            </div>
            <button onClick={() => saveSettings("Web3 Settings")} disabled={saving} style={buttonStyle}>
              {saving ? "Saving..." : "Save Web3 Settings"}
            </button>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api" && (
        <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>API Keys</h2>
          
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.openaiApiKey}
                onChange={(e) => updateSetting("openaiApiKey", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>ElevenLabs API Key</label>
              <input
                type="password"
                placeholder="Voice cloning API"
                value={settings.elevenLabsApiKey}
                onChange={(e) => updateSetting("elevenLabsApiKey", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Replicate API Token</label>
              <input
                type="password"
                placeholder="For avatar generation"
                value={settings.replicateApiToken}
                onChange={(e) => updateSetting("replicateApiToken", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>RunPod API Key</label>
              <input
                type="password"
                placeholder="GPU worker access"
                value={settings.runpodApiKey}
                onChange={(e) => updateSetting("runpodApiKey", e.target.value)}
                style={inputStyle}
              />
            </div>
            <button onClick={() => saveSettings("API Keys")} disabled={saving} style={buttonStyle}>
              {saving ? "Saving..." : "Save API Keys"}
            </button>
          </div>
        </div>
      )}

      {/* CMS Tab (Genesis Only) */}
      {activeTab === "cms" && isGenesis && (
        <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>CMS Controls</h2>
          
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting("platformName", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Primary Color</label>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                style={{ ...inputStyle, height: "50px", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Logo URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={settings.logoUrl}
                onChange={(e) => updateSetting("logoUrl", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb" }}>Footer Text</label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => updateSetting("footerText", e.target.value)}
                style={inputStyle}
              />
            </div>
            <button onClick={() => saveSettings("CMS Settings")} disabled={saving} style={buttonStyle}>
              {saving ? "Saving..." : "Save CMS Settings"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#0f0f0f",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "white",
  fontSize: "16px",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "14px 24px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
};
