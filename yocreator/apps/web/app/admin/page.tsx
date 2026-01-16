"use client";
import { useState, useEffect } from "react";
import { useResponsive } from "../../lib/useResponsive";

interface Job {
  id: string;
  type: string;
  status: string;
  created_at: string;
  user_id?: string;
  output_url?: string;
}

interface GPUNode {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  gpu: string;
  jobs: number;
  lastPing: Date;
}

interface Lead {
  id: string;
  email: string;
  name: string;
  source: string;
  created_at: string;
  segment: string;
}

export default function AdminDashboard() {
  const { isMobile, isTablet } = useResponsive();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalJobs: 0, 
    completedJobs: 0, 
    revenue: 0,
    failedJobs: 0,
    processingJobs: 0 
  });
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "marketing" | "nodes" | "analytics">("overview");
  
  // GPU Nodes state
  const [nodes, setNodes] = useState<GPUNode[]>([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeGPU, setNewNodeGPU] = useState("RTX 4090");
  const [newNodeEndpoint, setNewNodeEndpoint] = useState("");
  
  // Marketing state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showCampaign, setShowCampaign] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  
  // User management state
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
  const RUNPOD_API_KEY = process.env.NEXT_PUBLIC_RUNPOD_API_KEY || "";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.role !== "genesis") {
        window.location.href = "/";
      }
    } else {
      window.location.href = "/login";
    }
    loadData();
    loadNodes();
    loadLeads();
  }, []);

  async function loadData() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    
    try {
      const jobsRes = await fetch(`${SUPABASE_URL}/rest/v1/render_jobs?select=*&order=created_at.desc&limit=100`, {
        headers: { apikey: SUPABASE_KEY },
      });
      const jobsData = await jobsRes.json();
      if (Array.isArray(jobsData)) {
        setJobs(jobsData);
        const completed = jobsData.filter((j: any) => j.status === "completed").length;
        const failed = jobsData.filter((j: any) => j.status === "error").length;
        const processing = jobsData.filter((j: any) => j.status === "processing").length;
        setStats(s => ({
          ...s,
          totalJobs: jobsData.length,
          completedJobs: completed,
          failedJobs: failed,
          processingJobs: processing,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadNodes() {
    const savedNodes = localStorage.getItem("gpu_nodes");
    if (savedNodes) {
      setNodes(JSON.parse(savedNodes));
    } else if (RUNPOD_API_KEY) {
      try {
        const res = await fetch("https://api.runpod.io/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RUNPOD_API_KEY}`,
          },
          body: JSON.stringify({
            query: `query { myself { pods { id name runtime { gpus { displayName } } } } }`,
          }),
        });
        const data = await res.json();
        if (data?.data?.myself?.pods) {
          const runpodNodes: GPUNode[] = data.data.myself.pods.map((pod: any) => ({
            id: pod.id,
            name: pod.name || `RunPod-${pod.id.slice(0, 8)}`,
            status: "online" as const,
            gpu: pod.runtime?.gpus?.[0]?.displayName || "Unknown GPU",
            jobs: 0,
            lastPing: new Date(),
          }));
          setNodes(runpodNodes);
          localStorage.setItem("gpu_nodes", JSON.stringify(runpodNodes));
        }
      } catch (e) {
        console.log("RunPod API not available:", e);
      }
    }
  }

  async function loadLeads() {
    const savedLeads = localStorage.getItem("marketing_leads");
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    } else {
      const demoLeads: Lead[] = [
        { id: "1", email: "john@example.com", name: "John Doe", source: "signup", created_at: new Date().toISOString(), segment: "active" },
        { id: "2", email: "jane@startup.io", name: "Jane Smith", source: "waitlist", created_at: new Date().toISOString(), segment: "trial" },
      ];
      setLeads(demoLeads);
      localStorage.setItem("marketing_leads", JSON.stringify(demoLeads));
    }
  }

  function addNode() {
    if (!newNodeName.trim()) {
      alert("Please enter a node name");
      return;
    }
    const newNode: GPUNode = {
      id: Date.now().toString(),
      name: newNodeName,
      status: newNodeEndpoint ? "online" : "offline",
      gpu: newNodeGPU,
      jobs: 0,
      lastPing: new Date(),
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    localStorage.setItem("gpu_nodes", JSON.stringify(updated));
    setShowAddNode(false);
    setNewNodeName("");
    setNewNodeEndpoint("");
  }

  function removeNode(id: string) {
    if (confirm("Remove this node?")) {
      const updated = nodes.filter(n => n.id !== id);
      setNodes(updated);
      localStorage.setItem("gpu_nodes", JSON.stringify(updated));
    }
  }

  function toggleNodeStatus(id: string) {
    const updated = nodes.map(n => {
      if (n.id === id) {
        return { ...n, status: n.status === "online" ? "offline" as const : "online" as const };
      }
      return n;
    });
    setNodes(updated);
    localStorage.setItem("gpu_nodes", JSON.stringify(updated));
  }

  function exportLeads() {
    const csv = [
      "Email,Name,Source,Segment,Created",
      ...leads.map(l => `${l.email},${l.name},${l.source},${l.segment},${l.created_at}`)
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function sendCampaign() {
    if (!campaignSubject || !campaignBody) {
      alert("Please fill in subject and body");
      return;
    }
    const targetLeads = selectedSegment === "all" 
      ? leads 
      : leads.filter(l => l.segment === selectedSegment);
    
    alert(`Campaign "${campaignSubject}" would be sent to ${targetLeads.length} leads.\n\nTo enable: Connect your email service API (SendGrid, Mailchimp, etc.)`);
    setShowCampaign(false);
    setCampaignSubject("");
    setCampaignBody("");
  }

  function addLead() {
    if (!newUserEmail) {
      alert("Please enter an email");
      return;
    }
    const newLead: Lead = {
      id: Date.now().toString(),
      email: newUserEmail,
      name: newUserEmail.split("@")[0],
      source: "manual",
      segment: "new",
      created_at: new Date().toISOString(),
    };
    const updated = [...leads, newLead];
    setLeads(updated);
    localStorage.setItem("marketing_leads", JSON.stringify(updated));
    setShowAddUser(false);
    setNewUserEmail("");
  }

  function deleteJob(jobId: string) {
    if (!confirm("Delete this job?")) return;
    
    fetch(`${SUPABASE_URL}/rest/v1/render_jobs?id=eq.${jobId}`, {
      method: "DELETE",
      headers: { 
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }).then(() => {
      loadData();
    });
  }

  if (!user || user.role !== "genesis") {
    return <main style={{ padding: "40px", textAlign: "center" }}>Loading...</main>;
  }

  const filteredLeads = leads.filter(l => 
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main style={{ padding: isMobile ? "16px" : "40px", maxWidth: "1400px", margin: "0 auto", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between", 
        alignItems: isMobile ? "flex-start" : "center", 
        marginBottom: isMobile ? "24px" : "40px",
        gap: "16px"
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "28px" : "48px", fontWeight: "bold" }}>👑 Master Dashboard</h1>
          <p style={{ color: "#888", fontSize: isMobile ? "14px" : "16px" }}>Genesis Account: Full Platform Control</p>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <a href="/admin/cms" style={{ padding: "8px 16px", backgroundColor: "#8b5cf6", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>🎨 CMS Editor</a>
          <a href="/studio" style={{ color: "#888", textDecoration: "none", fontSize: isMobile ? "14px" : "16px" }}>← Back to Studio</a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "30px", 
        overflowX: "auto",
        paddingBottom: "10px"
      }}>
        {[
          { id: "overview", label: "📊 Overview", icon: "📊" },
          { id: "users", label: "👥 Users", icon: "👥" },
          { id: "marketing", label: "📣 Marketing", icon: "📣" },
          { id: "nodes", label: "🖥️ GPU Nodes", icon: "🖥️" },
          { id: "analytics", label: "📈 Analytics", icon: "📈" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: isMobile ? "10px 16px" : "12px 24px",
              backgroundColor: activeTab === tab.id ? "#2563eb" : "#1a1a1a",
              color: "white",
              border: activeTab === tab.id ? "none" : "1px solid #333",
              borderRadius: "8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            {isMobile ? tab.icon : tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Stats Cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)", 
            gap: isMobile ? "12px" : "20px", 
            marginBottom: isMobile ? "24px" : "40px" 
          }}>
            {[
              { label: "Total Jobs", value: stats.totalJobs, icon: "📊", color: "#8b5cf6" },
              { label: "Completed", value: stats.completedJobs, icon: "✅", color: "#4ade80" },
              { label: "Processing", value: stats.processingJobs, icon: "⏳", color: "#f59e0b" },
              { label: "Failed", value: stats.failedJobs, icon: "❌", color: "#ef4444" },
              { label: "GPU Nodes", value: nodes.filter(n => n.status === "online").length, icon: "🖥️", color: "#3b82f6" },
              { label: "Leads", value: leads.length, icon: "👥", color: "#ec4899" },
            ].map((stat) => (
              <div key={stat.label} style={{ 
                backgroundColor: "#1a1a1a", 
                padding: isMobile ? "16px" : "24px", 
                borderRadius: "12px", 
                border: "1px solid #333" 
              }}>
                <div style={{ fontSize: isMobile ? "24px" : "32px", marginBottom: "8px" }}>{stat.icon}</div>
                <div style={{ fontSize: isMobile ? "24px" : "36px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
                <div style={{ color: "#888", fontSize: isMobile ? "12px" : "14px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Jobs */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: isMobile ? "20px" : "24px" }}>Recent Jobs</h2>
              <button 
                onClick={loadData}
                style={{ padding: "8px 16px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                🔄 Refresh
              </button>
            </div>
            <div style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", border: "1px solid #333", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 10).map((job) => (
                    <tr key={job.id} style={{ borderBottom: "1px solid #222" }}>
                      <td style={tdStyle}>#{job.id}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "4px 8px", backgroundColor: "#333", borderRadius: "4px", fontSize: "12px" }}>
                          {job.type}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          color: job.status === "completed" ? "#4ade80" : 
                                 job.status === "error" ? "#ef4444" : 
                                 job.status === "processing" ? "#f59e0b" : "#3b82f6"
                        }}>
                          {job.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{new Date(job.created_at).toLocaleString()}</td>
                      <td style={tdStyle}>
                        {job.output_url && (
                          <a 
                            href={job.output_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ padding: "6px 12px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginRight: "8px", textDecoration: "none" }}
                          >
                            View
                          </a>
                        )}
                        <button 
                          onClick={() => deleteJob(job.id)}
                          style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#666" }}>No jobs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: isMobile ? "20px" : "24px" }}>👥 Lead Management</h2>
            <button 
              onClick={() => setShowAddUser(true)}
              style={{ padding: "10px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              + Add Lead
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "12px 16px",
              backgroundColor: "#0f0f0f",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "white",
              width: "100%",
              maxWidth: "400px",
              marginBottom: "20px"
            }}
          />

          <div style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", border: "1px solid #333", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Segment</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={tdStyle}>{lead.email}</td>
                    <td style={tdStyle}>{lead.name}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: "4px 8px", backgroundColor: "#333", borderRadius: "4px", fontSize: "12px" }}>
                        {lead.source}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={lead.segment}
                        onChange={(e) => {
                          const updated = leads.map(l => l.id === lead.id ? { ...l, segment: e.target.value } : l);
                          setLeads(updated);
                          localStorage.setItem("marketing_leads", JSON.stringify(updated));
                        }}
                        style={{ padding: "4px 8px", backgroundColor: "#0f0f0f", color: "white", border: "1px solid #333", borderRadius: "4px" }}
                      >
                        <option value="new">New</option>
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="paying">Paying</option>
                        <option value="churned">Churned</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => {
                          if (confirm("Delete this lead?")) {
                            const updated = leads.filter(l => l.id !== lead.id);
                            setLeads(updated);
                            localStorage.setItem("marketing_leads", JSON.stringify(updated));
                          }
                        }}
                        style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
              <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
                <h3 style={{ marginBottom: "20px" }}>Add New Lead</h3>
                <input
                  type="email"
                  placeholder="Email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px" }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={addLead} style={{ flex: 1, padding: "12px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Add Lead
                  </button>
                  <button onClick={() => setShowAddUser(false)} style={{ flex: 1, padding: "12px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Marketing Tab */}
      {activeTab === "marketing" && (
        <div>
          <h2 style={{ fontSize: isMobile ? "20px" : "24px", marginBottom: "20px" }}>📣 Marketing Engine</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            {/* Email Campaigns */}
            <div style={{ backgroundColor: "#1a1a1a", padding: "24px", borderRadius: "12px", border: "1px solid #333" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>📧 Email Campaigns</h3>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}>
                Send targeted email campaigns to your leads
              </p>
              <button 
                onClick={() => setShowCampaign(true)}
                style={{ padding: "12px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", width: "100%" }}
              >
                Create Campaign
              </button>
            </div>

            {/* Data Export */}
            <div style={{ backgroundColor: "#1a1a1a", padding: "24px", borderRadius: "12px", border: "1px solid #333" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>📥 Data Export</h3>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}>
                Export leads to CSV for external tools
              </p>
              <button 
                onClick={exportLeads}
                style={{ padding: "12px 20px", backgroundColor: "#4ade80", color: "black", border: "none", borderRadius: "8px", cursor: "pointer", width: "100%" }}
              >
                Export {leads.length} Leads to CSV
              </button>
            </div>
          </div>

          {/* Segment Stats */}
          <div style={{ backgroundColor: "#1a1a1a", padding: "24px", borderRadius: "12px", border: "1px solid #333" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>📊 Segment Breakdown</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: "15px" }}>
              {["new", "active", "trial", "paying", "churned"].map(segment => {
                const count = leads.filter(l => l.segment === segment).length;
                const colors: Record<string, string> = { new: "#3b82f6", active: "#4ade80", trial: "#f59e0b", paying: "#8b5cf6", churned: "#ef4444" };
                return (
                  <div key={segment} style={{ textAlign: "center", padding: "20px", backgroundColor: "#0f0f0f", borderRadius: "8px" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: colors[segment] }}>{count}</div>
                    <div style={{ color: "#888", textTransform: "capitalize" }}>{segment}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Modal */}
          {showCampaign && (
            <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
              <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "500px" }}>
                <h3 style={{ marginBottom: "20px" }}>📧 Create Email Campaign</h3>
                
                <label style={{ display: "block", marginBottom: "5px", color: "#888" }}>Target Segment</label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px" }}
                >
                  <option value="all">All Leads ({leads.length})</option>
                  <option value="new">New ({leads.filter(l => l.segment === "new").length})</option>
                  <option value="active">Active ({leads.filter(l => l.segment === "active").length})</option>
                  <option value="trial">Trial ({leads.filter(l => l.segment === "trial").length})</option>
                  <option value="paying">Paying ({leads.filter(l => l.segment === "paying").length})</option>
                </select>

                <label style={{ display: "block", marginBottom: "5px", color: "#888" }}>Subject Line</label>
                <input
                  type="text"
                  placeholder="Your amazing offer..."
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px" }}
                />

                <label style={{ display: "block", marginBottom: "5px", color: "#888" }}>Email Body</label>
                <textarea
                  placeholder="Write your email content..."
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  rows={5}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px", resize: "vertical" }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={sendCampaign} style={{ flex: 1, padding: "12px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Send Campaign
                  </button>
                  <button onClick={() => setShowCampaign(false)} style={{ flex: 1, padding: "12px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>

                <p style={{ color: "#666", fontSize: "12px", marginTop: "15px", textAlign: "center" }}>
                  Note: Connect SendGrid or Mailchimp API to enable actual sending
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GPU Nodes Tab */}
      {activeTab === "nodes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: isMobile ? "20px" : "24px" }}>🖥️ GPU Node Network</h2>
            <button 
              onClick={() => setShowAddNode(true)}
              style={{ padding: "10px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              + Add Node
            </button>
          </div>

          {/* RunPod Info */}
          <div style={{ backgroundColor: "#1a1a1a", padding: "20px", borderRadius: "12px", border: "1px solid #333", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ marginBottom: "5px" }}>☁️ RunPod Integration</h3>
                <p style={{ color: "#888", fontSize: "14px" }}>
                  {RUNPOD_API_KEY ? "✅ API Key configured" : "⚠️ Add NEXT_PUBLIC_RUNPOD_API_KEY to enable"}
                </p>
              </div>
              <a 
                href="https://www.runpod.io/console/pods" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ padding: "10px 16px", backgroundColor: "#7c3aed", color: "white", borderRadius: "8px", textDecoration: "none" }}
              >
                Open RunPod Console →
              </a>
            </div>
          </div>

          {/* Nodes Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)", 
            gap: "15px" 
          }}>
            {nodes.map((node) => (
              <div key={node.id} style={{ 
                backgroundColor: "#1a1a1a", 
                padding: "20px", 
                borderRadius: "12px",
                border: `1px solid ${node.status === "online" ? "#4ade80" : node.status === "busy" ? "#f59e0b" : "#ef4444"}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <strong style={{ fontSize: "18px" }}>{node.name}</strong>
                  <span style={{ 
                    padding: "4px 12px", 
                    backgroundColor: node.status === "online" ? "#4ade8033" : node.status === "busy" ? "#f59e0b33" : "#ef444433",
                    color: node.status === "online" ? "#4ade80" : node.status === "busy" ? "#f59e0b" : "#ef4444",
                    borderRadius: "20px",
                    fontSize: "12px",
                    textTransform: "uppercase"
                  }}>
                    {node.status}
                  </span>
                </div>
                <p style={{ color: "#3b82f6", fontSize: "14px", marginBottom: "5px" }}>🎮 {node.gpu}</p>
                <p style={{ color: "#888", fontSize: "12px", marginBottom: "15px" }}>{node.jobs} jobs processed</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => toggleNodeStatus(node.id)}
                    style={{ 
                      flex: 1,
                      padding: "8px", 
                      backgroundColor: node.status === "online" ? "#f59e0b" : "#4ade80", 
                      color: "black", 
                      border: "none", 
                      borderRadius: "6px", 
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    {node.status === "online" ? "Pause" : "Start"}
                  </button>
                  <button 
                    onClick={() => removeNode(node.id)}
                    style={{ 
                      padding: "8px 12px", 
                      backgroundColor: "#ef4444", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "6px", 
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            {nodes.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "#666" }}>
                <p style={{ fontSize: "48px", marginBottom: "10px" }}>🖥️</p>
                <p>No GPU nodes configured yet.</p>
                <p style={{ fontSize: "14px" }}>Add a node or connect your RunPod account.</p>
              </div>
            )}
          </div>

          {/* Add Node Modal */}
          {showAddNode && (
            <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
              <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
                <h3 style={{ marginBottom: "20px" }}>🖥️ Add GPU Node</h3>
                
                <label style={{ display: "block", marginBottom: "5px", color: "#888" }}>Node Name</label>
                <input
                  type="text"
                  placeholder="My-GPU-Node"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px" }}
                />

                <label style={{ display: "block", marginBottom: "5px", color: "#888" }}>GPU Type</label>
                <select
                  value={newNodeGPU}
                  onChange={(e) => setNewNodeGPU(e.target.value)}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px" }}
                >
                  <option value="RTX 4090">NVIDIA RTX 4090</option>
                  <option value="RTX 3090">NVIDIA RTX 3090</option>
                  <option value="A100">NVIDIA A100</option>
                  <option value="H100">NVIDIA H100</option>
                  <option value="A10G">NVIDIA A10G</option>
                </select>

                <label style={{ display: "block", marginBottom: "5px", color: "#888" }}>Endpoint URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://your-runpod-endpoint.runpod.net"
                  value={newNodeEndpoint}
                  onChange={(e) => setNewNodeEndpoint(e.target.value)}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "8px", color: "white", marginBottom: "15px" }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={addNode} style={{ flex: 1, padding: "12px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Add Node
                  </button>
                  <button onClick={() => setShowAddNode(false)} style={{ flex: 1, padding: "12px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <h2 style={{ fontSize: isMobile ? "20px" : "24px", marginBottom: "20px" }}>📈 Analytics Dashboard</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
            {/* Job Types */}
            <div style={{ backgroundColor: "#1a1a1a", padding: "24px", borderRadius: "12px", border: "1px solid #333" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>Job Types Distribution</h3>
              {["video", "voice", "avatar"].map(type => {
                const count = jobs.filter(j => j.type === type).length;
                const percentage = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                const colors: Record<string, string> = { video: "#3b82f6", voice: "#8b5cf6", avatar: "#4ade80" };
                return (
                  <div key={type} style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ textTransform: "capitalize" }}>{type}</span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#333", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percentage}%`, backgroundColor: colors[type], transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Breakdown */}
            <div style={{ backgroundColor: "#1a1a1a", padding: "24px", borderRadius: "12px", border: "1px solid #333" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>Status Breakdown</h3>
              {["completed", "processing", "pending", "error"].map(status => {
                const count = jobs.filter(j => j.status === status).length;
                const percentage = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                const colors: Record<string, string> = { completed: "#4ade80", processing: "#f59e0b", pending: "#3b82f6", error: "#ef4444" };
                return (
                  <div key={status} style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ textTransform: "capitalize" }}>{status}</span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#333", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percentage}%`, backgroundColor: colors[status], transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div style={{ backgroundColor: "#1a1a1a", padding: "24px", borderRadius: "12px", border: "1px solid #333", gridColumn: isMobile ? "1" : "1 / -1" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>📅 Jobs by Day (Last 7 Days)</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "150px" }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const dateStr = date.toISOString().slice(0, 10);
                  const count = jobs.filter(j => j.created_at.slice(0, 10) === dateStr).length;
                  const maxJobs = Math.max(...Array.from({ length: 7 }).map((_, j) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - j));
                    return jobs.filter(job => job.created_at.slice(0, 10) === d.toISOString().slice(0, 10)).length;
                  }), 1);
                  const height = (count / maxJobs) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ 
                        width: "100%", 
                        height: `${Math.max(height, 5)}%`, 
                        backgroundColor: "#3b82f6", 
                        borderRadius: "4px 4px 0 0",
                        minHeight: "5px"
                      }} />
                      <span style={{ fontSize: "10px", color: "#888", marginTop: "5px" }}>{date.toLocaleDateString("en", { weekday: "short" })}</span>
                      <span style={{ fontSize: "12px", color: "#3b82f6" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "16px",
  textAlign: "left",
  color: "#888",
  fontSize: "14px",
  fontWeight: "500",
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  color: "white",
  fontSize: "14px",
};
