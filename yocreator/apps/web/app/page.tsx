"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <main>
      {/* Hero Section */}
      <section style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background Video/Image */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
          zIndex: 0,
        }}>
          <img
            src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="AI Technology Background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.2,
            }}
          />
        </div>
        
        {/* Gradient Overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(15,15,15,0.7) 0%, rgba(15,15,15,0.9) 100%)",
          zIndex: 1,
        }} />

        {/* Content */}
        <div style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
        }}>
          <div>
            <div style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: "rgba(37, 99, 235, 0.2)",
              borderRadius: "20px",
              marginBottom: "24px",
            }}>
              <span style={{ color: "#60a5fa", fontSize: "14px", fontWeight: "500" }}>
                🚀 AI-Powered Video Creation Platform
              </span>
            </div>
            
            <h1 style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: "24px",
              background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Create Stunning AI Videos in Minutes
            </h1>
            
            <p style={{
              fontSize: "20px",
              color: "#9ca3af",
              lineHeight: 1.7,
              marginBottom: "40px",
              maxWidth: "500px",
            }}>
              Generate professional voices, custom avatars, and cinematic videos 
              with the power of artificial intelligence. No experience required.
            </p>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {isAuthenticated ? (
                <Link href="/studio" style={{
                  padding: "16px 32px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: "18px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  Go to Studio →
                </Link>
              ) : (
                <>
                  <Link href="/login" style={{
                    padding: "16px 32px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "18px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    Get Started Free →
                  </Link>
                  <Link href="#features" style={{
                    padding: "16px 32px",
                    backgroundColor: "transparent",
                    color: "white",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "18px",
                    fontWeight: "500",
                    border: "1px solid #333",
                  }}>
                    Learn More
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div style={{
              display: "flex",
              gap: "40px",
              marginTop: "60px",
              paddingTop: "40px",
              borderTop: "1px solid #222",
            }}>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "700", color: "#60a5fa" }}>10K+</div>
                <div style={{ color: "#666", fontSize: "14px" }}>Videos Created</div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "700", color: "#a78bfa" }}>50+</div>
                <div style={{ color: "#666", fontSize: "14px" }}>AI Voices</div>
              </div>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "700", color: "#34d399" }}>99%</div>
                <div style={{ color: "#666", fontSize: "14px" }}>Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div style={{
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          }}>
            <img
              src="https://images.pexels.com/photos/8728380/pexels-photo-8728380.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="AI Video Creation"
              style={{
                width: "100%",
                height: "500px",
                objectFit: "cover",
              }}
            />
            <div style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              right: "20px",
              padding: "20px",
              backgroundColor: "rgba(0,0,0,0.8)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}>
                  ▶️
                </div>
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>AI Video Rendering</div>
                  <div style={{ color: "#888", fontSize: "14px" }}>Processing in real-time...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: "120px 40px",
        backgroundColor: "#0a0a0a",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 style={{
              fontSize: "48px",
              fontWeight: "700",
              marginBottom: "20px",
            }}>
              Powerful AI Tools at Your Fingertips
            </h2>
            <p style={{ color: "#888", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
              Everything you need to create professional video content without the complexity
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
          }}>
            {/* Voice Card */}
            <div style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #222",
            }}>
              <img
                src="https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="AI Voice Generation"
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
              />
              <div style={{ padding: "30px" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: "#2563eb20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "20px",
                }}>
                  🎤
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "12px" }}>
                  AI Voice Generation
                </h3>
                <p style={{ color: "#888", lineHeight: 1.7, marginBottom: "20px" }}>
                  Transform text into natural-sounding speech with 50+ AI voices in multiple languages.
                </p>
                <Link href="/studio/voice" style={{
                  color: "#60a5fa",
                  textDecoration: "none",
                  fontWeight: "500",
                }}>
                  Try Voice →
                </Link>
              </div>
            </div>

            {/* Avatar Card */}
            <div style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #222",
            }}>
              <img
                src="https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="AI Avatar Creation"
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
              />
              <div style={{ padding: "30px" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: "#a78bfa20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "20px",
                }}>
                  👤
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "12px" }}>
                  Custom AI Avatars
                </h3>
                <p style={{ color: "#888", lineHeight: 1.7, marginBottom: "20px" }}>
                  Create photorealistic digital avatars that speak and move naturally.
                </p>
                <Link href="/studio/avatar" style={{
                  color: "#a78bfa",
                  textDecoration: "none",
                  fontWeight: "500",
                }}>
                  Create Avatar →
                </Link>
              </div>
            </div>

            {/* Video Card */}
            <div style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #222",
            }}>
              <img
                src="https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="AI Video Production"
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
              />
              <div style={{ padding: "30px" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: "#34d39920",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "20px",
                }}>
                  🎬
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "12px" }}>
                  AI Video Production
                </h3>
                <p style={{ color: "#888", lineHeight: 1.7, marginBottom: "20px" }}>
                  Generate stunning videos with AI-powered editing and effects.
                </p>
                <Link href="/studio/video" style={{
                  color: "#34d399",
                  textDecoration: "none",
                  fontWeight: "500",
                }}>
                  Make Video →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: "120px 40px",
        backgroundColor: "#0f0f0f",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 style={{ fontSize: "48px", fontWeight: "700", marginBottom: "20px" }}>
              How It Works
            </h2>
            <p style={{ color: "#888", fontSize: "18px" }}>
              Create professional videos in three simple steps
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "40px",
          }}>
            {[
              { step: "01", title: "Write Your Script", desc: "Enter your text or upload a script. Our AI understands context and tone.", icon: "✍️" },
              { step: "02", title: "Choose Your Style", desc: "Select AI voice, avatar, and video style from our extensive library.", icon: "🎨" },
              { step: "03", title: "Generate & Export", desc: "Click render and download your professional video in minutes.", icon: "🚀" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#1a1a1a",
                  border: "2px solid #333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  margin: "0 auto 24px",
                }}>
                  {item.icon}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#2563eb",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "12px" }}>
                  {item.title}
                </h3>
                <p style={{ color: "#888", lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        padding: "120px 40px",
        backgroundColor: "#0a0a0a",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "48px", fontWeight: "700", textAlign: "center", marginBottom: "60px" }}>
            Loved by Creators
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
          }}>
            {[
              { name: "Sarah Chen", role: "Marketing Director", text: "YOcreator has revolutionized how we create video content. What used to take days now takes hours.", avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150" },
              { name: "Marcus Johnson", role: "Content Creator", text: "The AI voices are incredibly natural. My audience can't even tell the difference from real voiceovers.", avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150" },
              { name: "Emily Rodriguez", role: "Startup Founder", text: "We save thousands on video production every month. The avatar feature is a game-changer.", avatar: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150" },
            ].map((t, i) => (
              <div key={i} style={{
                padding: "30px",
                backgroundColor: "#1a1a1a",
                borderRadius: "16px",
                border: "1px solid #222",
              }}>
                <p style={{ color: "#ccc", lineHeight: 1.8, marginBottom: "24px", fontSize: "16px" }}>
                  &quot;{t.text}&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={t.avatar}
                    alt={t.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: "600" }}>{t.name}</div>
                    <div style={{ color: "#888", fontSize: "14px" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: "120px 40px",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
        }}>
          <img
            src="https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        
        <div style={{
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}>
          <h2 style={{
            fontSize: "48px",
            fontWeight: "700",
            marginBottom: "24px",
          }}>
            Ready to Create Amazing Videos?
          </h2>
          <p style={{
            fontSize: "20px",
            color: "#9ca3af",
            marginBottom: "40px",
          }}>
            Join thousands of creators using YOcreator to produce professional video content with AI.
          </p>
          
          {isAuthenticated ? (
            <Link href="/studio" style={{
              display: "inline-block",
              padding: "18px 40px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: "600",
            }}>
              Open Studio →
            </Link>
          ) : (
            <Link href="/login" style={{
              display: "inline-block",
              padding: "18px 40px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: "600",
            }}>
              Start Creating for Free →
            </Link>
          )}
          
          <p style={{ color: "#666", fontSize: "14px", marginTop: "20px" }}>
            No credit card required • Free tier available
          </p>
        </div>
      </section>
    </main>
  );
}
