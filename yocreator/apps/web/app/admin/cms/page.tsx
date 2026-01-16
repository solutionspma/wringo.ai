"use client";
import { useState, useEffect, useRef } from "react";
import { useResponsive } from "../../../lib/useResponsive";

interface CMSElement {
  id: string;
  type: "text" | "heading" | "image" | "button" | "container" | "divider";
  content: string;
  styles: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    border?: string;
    width?: string;
    height?: string;
    textAlign?: string;
    display?: string;
    flexDirection?: string;
    gap?: string;
    opacity?: string;
    boxShadow?: string;
  };
  children?: CMSElement[];
}

interface CMSPage {
  id: string;
  name: string;
  slug: string;
  elements: CMSElement[];
  meta: {
    title: string;
    description: string;
  };
}

const defaultPage: CMSPage = {
  id: "landing",
  name: "Landing Page",
  slug: "/",
  meta: { title: "YOcreator", description: "AI-Powered Content Creation" },
  elements: [],
};

export default function CMSEditor() {
  const { isMobile, isTablet } = useResponsive();
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<CMSPage[]>([defaultPage]);
  const [activePage, setActivePage] = useState<string>("landing");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<"pages" | "elements" | "layers">("elements");
  const [rightPanel, setRightPanel] = useState<"style" | "settings" | "code">("style");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState<CMSPage[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragElement, setDragElement] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.role !== "genesis") {
        window.location.href = "/";
        return;
      }
      loadPages();
    } else {
      window.location.href = "/login";
    }
  }, []);

  async function loadPages() {
    const saved = localStorage.getItem("cms_pages");
    if (saved) {
      setPages(JSON.parse(saved));
    }
  }

  function savePages(newPages: CMSPage[]) {
    setPages(newPages);
    localStorage.setItem("cms_pages", JSON.stringify(newPages));
    
    // Save to history for undo/redo
    const newHistory = [...history.slice(0, historyIndex + 1), newPages];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }

  function undo() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPages(history[historyIndex - 1]);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPages(history[historyIndex + 1]);
    }
  }

  function getCurrentPage(): CMSPage | undefined {
    return pages.find(p => p.id === activePage);
  }

  function addElement(type: CMSElement["type"]) {
    const page = getCurrentPage();
    if (!page) return;

    const newElement: CMSElement = {
      id: `el_${Date.now()}`,
      type,
      content: type === "heading" ? "New Heading" : type === "text" ? "New text paragraph" : type === "button" ? "Click Me" : "",
      styles: {
        padding: type === "container" ? "20px" : "10px",
        margin: "10px",
        color: type === "button" ? "#ffffff" : "#ffffff",
        backgroundColor: type === "button" ? "#2563eb" : type === "container" ? "#1a1a1a" : "transparent",
        borderRadius: type === "button" ? "8px" : type === "container" ? "12px" : "0",
        fontSize: type === "heading" ? "32px" : "16px",
        fontWeight: type === "heading" ? "bold" : "normal",
        width: type === "container" || type === "divider" ? "100%" : "auto",
        height: type === "divider" ? "1px" : "auto",
        textAlign: "left",
      },
    };

    const newPages = pages.map(p => {
      if (p.id === activePage) {
        return { ...p, elements: [...p.elements, newElement] };
      }
      return p;
    });
    savePages(newPages);
    setSelectedElement(newElement.id);
  }

  function updateElement(elementId: string, updates: Partial<CMSElement>) {
    const newPages = pages.map(p => {
      if (p.id === activePage) {
        return {
          ...p,
          elements: p.elements.map(el => 
            el.id === elementId ? { ...el, ...updates } : el
          ),
        };
      }
      return p;
    });
    savePages(newPages);
  }

  function updateElementStyle(elementId: string, styleProp: string, value: string) {
    const page = getCurrentPage();
    if (!page) return;
    
    const element = page.elements.find(el => el.id === elementId);
    if (!element) return;
    
    updateElement(elementId, {
      styles: { ...element.styles, [styleProp]: value }
    });
  }

  function deleteElement(elementId: string) {
    const newPages = pages.map(p => {
      if (p.id === activePage) {
        return { ...p, elements: p.elements.filter(el => el.id !== elementId) };
      }
      return p;
    });
    savePages(newPages);
    setSelectedElement(null);
  }

  function duplicateElement(elementId: string) {
    const page = getCurrentPage();
    if (!page) return;
    
    const element = page.elements.find(el => el.id === elementId);
    if (!element) return;

    const newElement = { ...element, id: `el_${Date.now()}` };
    const newPages = pages.map(p => {
      if (p.id === activePage) {
        return { ...p, elements: [...p.elements, newElement] };
      }
      return p;
    });
    savePages(newPages);
    setSelectedElement(newElement.id);
  }

  function moveElement(elementId: string, direction: "up" | "down") {
    const page = getCurrentPage();
    if (!page) return;
    
    const index = page.elements.findIndex(el => el.id === elementId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === page.elements.length - 1) return;

    const newElements = [...page.elements];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];

    const newPages = pages.map(p => {
      if (p.id === activePage) {
        return { ...p, elements: newElements };
      }
      return p;
    });
    savePages(newPages);
  }

  function addPage() {
    const newPage: CMSPage = {
      id: `page_${Date.now()}`,
      name: "New Page",
      slug: `/page-${pages.length}`,
      meta: { title: "New Page", description: "" },
      elements: [],
    };
    savePages([...pages, newPage]);
    setActivePage(newPage.id);
  }

  function deletePage(pageId: string) {
    if (pages.length <= 1) {
      alert("Cannot delete the last page");
      return;
    }
    if (!confirm("Delete this page?")) return;
    
    const newPages = pages.filter(p => p.id !== pageId);
    savePages(newPages);
    if (activePage === pageId) {
      setActivePage(newPages[0].id);
    }
  }

  function exportCode() {
    const page = getCurrentPage();
    if (!page) return;
    
    let jsx = `export default function ${page.name.replace(/\s/g, "")}Page() {\n  return (\n    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>\n`;
    
    page.elements.forEach(el => {
      const styleStr = Object.entries(el.styles)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(", ");
      
      if (el.type === "heading") {
        jsx += `      <h1 style={{ ${styleStr} }}>${el.content}</h1>\n`;
      } else if (el.type === "text") {
        jsx += `      <p style={{ ${styleStr} }}>${el.content}</p>\n`;
      } else if (el.type === "button") {
        jsx += `      <button style={{ ${styleStr}, border: "none", cursor: "pointer" }}>${el.content}</button>\n`;
      } else if (el.type === "image") {
        jsx += `      <img src="${el.content}" alt="" style={{ ${styleStr} }} />\n`;
      } else if (el.type === "divider") {
        jsx += `      <hr style={{ ${styleStr}, border: "none", backgroundColor: "#333" }} />\n`;
      } else if (el.type === "container") {
        jsx += `      <div style={{ ${styleStr} }}></div>\n`;
      }
    });
    
    jsx += `    </main>\n  );\n}`;
    
    navigator.clipboard.writeText(jsx);
    alert("Code copied to clipboard!");
  }

  const page = getCurrentPage();
  const selectedEl = page?.elements.find(el => el.id === selectedElement);

  if (!user || user.role !== "genesis") {
    return <main style={{ padding: "40px", textAlign: "center" }}>Loading...</main>;
  }

  if (previewMode) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
        <div style={{ 
          padding: "10px 20px", 
          backgroundColor: "#1a1a1a", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: "1px solid #333"
        }}>
          <span style={{ color: "#888" }}>Preview Mode</span>
          <button 
            onClick={() => setPreviewMode(false)}
            style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Exit Preview
          </button>
        </div>
        <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
          {page?.elements.map(el => (
            <div key={el.id} style={el.styles as any}>
              {el.type === "heading" && <h1 style={{ margin: 0 }}>{el.content}</h1>}
              {el.type === "text" && <p style={{ margin: 0 }}>{el.content}</p>}
              {el.type === "button" && <button style={{ border: "none", cursor: "pointer", ...el.styles as any }}>{el.content}</button>}
              {el.type === "image" && <img src={el.content} alt="" style={{ maxWidth: "100%" }} />}
              {el.type === "divider" && <hr style={{ border: "none", backgroundColor: "#333", ...el.styles as any }} />}
              {el.type === "container" && <div style={el.styles as any}></div>}
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#0a0a0a" }}>
      {/* Top Toolbar */}
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        height: "50px", 
        backgroundColor: "#1a1a1a", 
        borderBottom: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <a href="/admin" style={{ color: "#888", textDecoration: "none", fontSize: "14px" }}>← Admin</a>
          <span style={{ color: "#333" }}>|</span>
          <span style={{ fontWeight: "bold", color: "#2563eb" }}>🎨 CMS Editor</span>
          <span style={{ color: "#666", fontSize: "12px" }}>{page?.name}</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={undo} disabled={historyIndex <= 0} style={toolBtnStyle} title="Undo (Ctrl+Z)">↩️</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} style={toolBtnStyle} title="Redo (Ctrl+Y)">↪️</button>
          <span style={{ color: "#333" }}>|</span>
          <button onClick={() => setShowGrid(!showGrid)} style={{ ...toolBtnStyle, backgroundColor: showGrid ? "#2563eb" : "#333" }}>⊞</button>
          <button onClick={() => setShowGuides(!showGuides)} style={{ ...toolBtnStyle, backgroundColor: showGuides ? "#2563eb" : "#333" }}>📏</button>
          <span style={{ color: "#333" }}>|</span>
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} style={toolBtnStyle}>−</button>
          <span style={{ color: "#888", fontSize: "12px", width: "40px", textAlign: "center" }}>{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} style={toolBtnStyle}>+</button>
          <span style={{ color: "#333" }}>|</span>
          <button onClick={() => setPreviewMode(true)} style={{ ...toolBtnStyle, backgroundColor: "#4ade80", color: "black" }}>👁 Preview</button>
          <button onClick={exportCode} style={{ ...toolBtnStyle, backgroundColor: "#8b5cf6" }}>📋 Export</button>
        </div>
      </div>

      {/* Left Panel */}
      <div style={{ 
        width: isMobile ? "200px" : "260px", 
        backgroundColor: "#141414", 
        borderRight: "1px solid #333", 
        marginTop: "50px",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Panel Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
          {(["pages", "elements", "layers"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setLeftPanel(tab)}
              style={{
                flex: 1,
                padding: "12px 8px",
                backgroundColor: leftPanel === tab ? "#1a1a1a" : "transparent",
                color: leftPanel === tab ? "white" : "#666",
                border: "none",
                borderBottom: leftPanel === tab ? "2px solid #2563eb" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "12px",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "15px" }}>
          {/* Pages Panel */}
          {leftPanel === "pages" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>PAGES</span>
                <button onClick={addPage} style={{ padding: "4px 8px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>+ Add</button>
              </div>
              {pages.map(p => (
                <div
                  key={p.id}
                  onClick={() => setActivePage(p.id)}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: activePage === p.id ? "#2563eb22" : "transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginBottom: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: activePage === p.id ? "1px solid #2563eb" : "1px solid transparent"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", color: activePage === p.id ? "#2563eb" : "white" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>{p.slug}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deletePage(p.id); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Elements Panel */}
          {leftPanel === "elements" && (
            <div>
              <span style={{ color: "#888", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "15px" }}>ADD ELEMENTS</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { type: "heading", icon: "H1", label: "Heading" },
                  { type: "text", icon: "T", label: "Text" },
                  { type: "button", icon: "⬜", label: "Button" },
                  { type: "image", icon: "🖼", label: "Image" },
                  { type: "container", icon: "⬜", label: "Container" },
                  { type: "divider", icon: "—", label: "Divider" },
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => addElement(item.type as any)}
                    style={{
                      padding: "15px 10px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{item.icon}</span>
                    <span style={{ fontSize: "11px", color: "#888" }}>{item.label}</span>
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#1a1a1a", borderRadius: "8px", border: "1px solid #333" }}>
                <span style={{ color: "#888", fontSize: "11px" }}>💡 Tip: Drag elements from here to the canvas, or click to add at the bottom.</span>
              </div>
            </div>
          )}

          {/* Layers Panel */}
          {leftPanel === "layers" && (
            <div>
              <span style={{ color: "#888", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "15px" }}>LAYERS</span>
              {page?.elements.map((el, i) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: selectedElement === el.id ? "#2563eb22" : "transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginBottom: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: selectedElement === el.id ? "1px solid #2563eb" : "1px solid transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#666", fontSize: "10px" }}>{i + 1}</span>
                    <span style={{ fontSize: "13px" }}>{el.type}</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, "up"); }} style={layerBtnStyle}>↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, "down"); }} style={layerBtnStyle}>↓</button>
                  </div>
                </div>
              ))}
              {(!page?.elements || page.elements.length === 0) && (
                <div style={{ color: "#666", textAlign: "center", padding: "20px", fontSize: "13px" }}>
                  No elements yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        style={{ 
          flex: 1, 
          backgroundColor: "#0a0a0a",
          marginTop: "50px",
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          padding: "40px",
          backgroundImage: showGrid ? "linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)" : "none",
          backgroundSize: "20px 20px"
        }}
      >
        <div style={{ 
          width: `${1200 * (zoom / 100)}px`, 
          minHeight: "800px",
          backgroundColor: "#0f0f0f",
          border: showGuides ? "1px solid #333" : "none",
          borderRadius: "8px",
          padding: "40px",
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center"
        }}>
          {page?.elements.map(el => (
            <div
              key={el.id}
              onClick={() => setSelectedElement(el.id)}
              style={{
                ...el.styles as any,
                outline: selectedElement === el.id ? "2px solid #2563eb" : "none",
                outlineOffset: "2px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {selectedElement === el.id && (
                <div style={{ 
                  position: "absolute", 
                  top: "-30px", 
                  left: 0, 
                  display: "flex", 
                  gap: "4px",
                  backgroundColor: "#1a1a1a",
                  padding: "4px",
                  borderRadius: "4px"
                }}>
                  <button onClick={() => duplicateElement(el.id)} style={canvasBtnStyle}>📋</button>
                  <button onClick={() => deleteElement(el.id)} style={{ ...canvasBtnStyle, backgroundColor: "#ef4444" }}>🗑️</button>
                </div>
              )}
              
              {el.type === "heading" && <h1 style={{ margin: 0, fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}>{el.content}</h1>}
              {el.type === "text" && <p style={{ margin: 0 }}>{el.content}</p>}
              {el.type === "button" && <span>{el.content}</span>}
              {el.type === "image" && (el.content ? <img src={el.content} alt="" style={{ maxWidth: "100%" }} /> : <div style={{ padding: "40px", textAlign: "center", border: "2px dashed #333" }}>🖼 Add image URL</div>)}
              {el.type === "divider" && <div style={{ width: "100%", height: "1px", backgroundColor: "#333" }} />}
              {el.type === "container" && <div style={{ minHeight: "100px", border: "1px dashed #333" }}></div>}
            </div>
          ))}
          
          {(!page?.elements || page.elements.length === 0) && (
            <div style={{ textAlign: "center", padding: "100px 40px", color: "#666" }}>
              <p style={{ fontSize: "48px", marginBottom: "20px" }}>🎨</p>
              <p style={{ fontSize: "18px", marginBottom: "10px" }}>Your canvas is empty</p>
              <p style={{ fontSize: "14px" }}>Add elements from the left panel to start building</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Style Editor */}
      <div style={{ 
        width: isMobile ? "240px" : "300px", 
        backgroundColor: "#141414", 
        borderLeft: "1px solid #333",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Panel Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
          {(["style", "settings", "code"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setRightPanel(tab)}
              style={{
                flex: 1,
                padding: "12px 8px",
                backgroundColor: rightPanel === tab ? "#1a1a1a" : "transparent",
                color: rightPanel === tab ? "white" : "#666",
                border: "none",
                borderBottom: rightPanel === tab ? "2px solid #2563eb" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "12px",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "15px" }}>
          {!selectedEl && (
            <div style={{ color: "#666", textAlign: "center", padding: "40px 20px" }}>
              <p>Select an element to edit its styles</p>
            </div>
          )}

          {selectedEl && rightPanel === "style" && (
            <div>
              <span style={{ color: "#888", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "15px" }}>
                STYLING: {selectedEl.type.toUpperCase()}
              </span>

              {/* Content */}
              {(selectedEl.type === "heading" || selectedEl.type === "text" || selectedEl.type === "button") && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>Content</label>
                  <textarea
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    rows={2}
                    style={{ ...styleInputStyle, resize: "vertical" }}
                  />
                </div>
              )}

              {selectedEl.type === "image" && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    style={styleInputStyle}
                  />
                </div>
              )}

              {/* Typography */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Typography</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Size</span>
                    <input
                      type="text"
                      value={selectedEl.styles.fontSize || "16px"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "fontSize", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Weight</span>
                    <select
                      value={selectedEl.styles.fontWeight || "normal"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "fontWeight", e.target.value)}
                      style={styleInputStyle}
                    >
                      <option value="normal">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semibold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Colors</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Text</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <input
                        type="color"
                        value={selectedEl.styles.color || "#ffffff"}
                        onChange={(e) => updateElementStyle(selectedEl.id, "color", e.target.value)}
                        style={{ width: "40px", height: "32px", padding: "2px", border: "1px solid #333", borderRadius: "4px", backgroundColor: "#0f0f0f" }}
                      />
                      <input
                        type="text"
                        value={selectedEl.styles.color || "#ffffff"}
                        onChange={(e) => updateElementStyle(selectedEl.id, "color", e.target.value)}
                        style={{ ...styleInputStyle, flex: 1 }}
                      />
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Background</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <input
                        type="color"
                        value={selectedEl.styles.backgroundColor || "#000000"}
                        onChange={(e) => updateElementStyle(selectedEl.id, "backgroundColor", e.target.value)}
                        style={{ width: "40px", height: "32px", padding: "2px", border: "1px solid #333", borderRadius: "4px", backgroundColor: "#0f0f0f" }}
                      />
                      <input
                        type="text"
                        value={selectedEl.styles.backgroundColor || "transparent"}
                        onChange={(e) => updateElementStyle(selectedEl.id, "backgroundColor", e.target.value)}
                        style={{ ...styleInputStyle, flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Spacing</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Padding</span>
                    <input
                      type="text"
                      value={selectedEl.styles.padding || "10px"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "padding", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Margin</span>
                    <input
                      type="text"
                      value={selectedEl.styles.margin || "10px"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "margin", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Size</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Width</span>
                    <input
                      type="text"
                      value={selectedEl.styles.width || "auto"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "width", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Height</span>
                    <input
                      type="text"
                      value={selectedEl.styles.height || "auto"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "height", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Border */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Border</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Radius</span>
                    <input
                      type="text"
                      value={selectedEl.styles.borderRadius || "0"}
                      onChange={(e) => updateElementStyle(selectedEl.id, "borderRadius", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Border</span>
                    <input
                      type="text"
                      placeholder="1px solid #333"
                      value={selectedEl.styles.border || ""}
                      onChange={(e) => updateElementStyle(selectedEl.id, "border", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Effects */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Effects</label>
                <div style={{ display: "grid", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Box Shadow</span>
                    <input
                      type="text"
                      placeholder="0 4px 6px rgba(0,0,0,0.1)"
                      value={selectedEl.styles.boxShadow || ""}
                      onChange={(e) => updateElementStyle(selectedEl.id, "boxShadow", e.target.value)}
                      style={styleInputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "#666" }}>Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={parseFloat(selectedEl.styles.opacity || "1") * 100}
                      onChange={(e) => updateElementStyle(selectedEl.id, "opacity", String(parseInt(e.target.value) / 100))}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Text Alignment */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Text Align</label>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["left", "center", "right"].map(align => (
                    <button
                      key={align}
                      onClick={() => updateElementStyle(selectedEl.id, "textAlign", align)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: selectedEl.styles.textAlign === align ? "#2563eb" : "#1a1a1a",
                        color: "white",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      {align === "left" ? "◀" : align === "center" ? "◆" : "▶"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedEl && rightPanel === "settings" && (
            <div>
              <span style={{ color: "#888", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "15px" }}>
                ELEMENT SETTINGS
              </span>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Element ID</label>
                <input type="text" value={selectedEl.id} readOnly style={{ ...styleInputStyle, color: "#666" }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Type</label>
                <input type="text" value={selectedEl.type} readOnly style={{ ...styleInputStyle, color: "#666", textTransform: "capitalize" }} />
              </div>

              <button 
                onClick={() => duplicateElement(selectedEl.id)} 
                style={{ width: "100%", padding: "10px", backgroundColor: "#1a1a1a", color: "white", border: "1px solid #333", borderRadius: "6px", cursor: "pointer", marginBottom: "10px" }}
              >
                📋 Duplicate Element
              </button>
              <button 
                onClick={() => deleteElement(selectedEl.id)} 
                style={{ width: "100%", padding: "10px", backgroundColor: "#ef444433", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer" }}
              >
                🗑️ Delete Element
              </button>
            </div>
          )}

          {rightPanel === "code" && (
            <div>
              <span style={{ color: "#888", fontSize: "12px", fontWeight: "500", display: "block", marginBottom: "15px" }}>
                GENERATED CODE
              </span>
              
              <div style={{ 
                backgroundColor: "#0f0f0f", 
                padding: "15px", 
                borderRadius: "8px", 
                border: "1px solid #333",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#4ade80",
                maxHeight: "400px",
                overflow: "auto",
                whiteSpace: "pre-wrap"
              }}>
                {selectedEl ? `<${selectedEl.type === "heading" ? "h1" : selectedEl.type === "text" ? "p" : selectedEl.type === "button" ? "button" : "div"}\n  style={{\n${Object.entries(selectedEl.styles).filter(([_, v]) => v).map(([k, v]) => `    ${k}: "${v}"`).join(",\n")}\n  }}\n>\n  ${selectedEl.content}\n</${selectedEl.type === "heading" ? "h1" : selectedEl.type === "text" ? "p" : selectedEl.type === "button" ? "button" : "div"}>` : "Select an element to view its code"}
              </div>

              <button 
                onClick={exportCode}
                style={{ width: "100%", padding: "10px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "15px" }}
              >
                📋 Export Full Page Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const toolBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  backgroundColor: "#333",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const layerBtnStyle: React.CSSProperties = {
  padding: "2px 6px",
  backgroundColor: "#333",
  color: "#888",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "10px",
};

const canvasBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  backgroundColor: "#333",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#888",
  fontSize: "12px",
  fontWeight: "500",
};

const styleInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  backgroundColor: "#0f0f0f",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "white",
  fontSize: "12px",
};
