"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for trying out YOcreator",
    features: [
      "1 AI Avatar",
      "5 voice generations/month",
      "3 video exports/month",
      "720p video quality",
      "YOcreator watermark",
      "Community support"
    ],
    buttonText: "Start Free"
  },
  {
    id: "creator",
    name: "Creator",
    price: 29,
    period: "/month",
    description: "For content creators & small businesses",
    features: [
      "5 AI Avatars",
      "50 voice generations/month",
      "20 video exports/month",
      "1080p video quality",
      "No watermark",
      "Custom voice cloning",
      "Priority support",
      "Commercial license"
    ],
    popular: true,
    buttonText: "Get Creator"
  },
  {
    id: "studio",
    name: "Studio",
    price: 99,
    period: "/month",
    description: "For agencies & production teams",
    features: [
      "Unlimited AI Avatars",
      "Unlimited voice generations",
      "Unlimited video exports",
      "4K video quality",
      "No watermark",
      "Advanced voice cloning",
      "Team collaboration",
      "API access",
      "Dedicated support",
      "White-label option"
    ],
    buttonText: "Get Studio"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: -1, // Custom pricing
    period: "",
    description: "For large organizations",
    features: [
      "Everything in Studio",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment",
      "Custom AI training",
      "Volume discounts"
    ],
    buttonText: "Contact Sales"
  }
];

export default function SignupPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<"plans" | "account">("plans");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === "enterprise") {
      // Redirect to contact form or email
      window.location.href = "mailto:sales@yocreator.com?subject=Enterprise%20Plan%20Inquiry";
      return;
    }
    setStep("account");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    // TODO: Create account in Supabase
    // const { data, error } = await supabase.auth.signUp({
    //   email: formData.email,
    //   password: formData.password,
    //   options: {
    //     data: {
    //       username: formData.username,
    //       plan: selectedPlan
    //     }
    //   }
    // });

    // For now, simulate account creation
    setTimeout(() => {
      // Store pending user data
      localStorage.setItem("pending_signup", JSON.stringify({
        ...formData,
        plan: selectedPlan,
        createdAt: new Date().toISOString()
      }));
      
      // Redirect to payment or login
      if (selectedPlan === "free") {
        router.push("/login?signup=success&plan=free");
      } else {
        // Would go to payment page
        router.push(`/checkout?plan=${selectedPlan}`);
      }
    }, 1500);
  };

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      color: "white",
      padding: "40px 20px"
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto 60px",
        textAlign: "center"
      }}>
        <Link href="/" style={{ 
          color: "#888", 
          textDecoration: "none", 
          fontSize: "14px",
          display: "inline-block",
          marginBottom: "24px"
        }}>
          ← Back to Home
        </Link>
        
        <h1 style={{ 
          fontSize: "48px", 
          fontWeight: "bold", 
          marginBottom: "16px",
          background: "linear-gradient(135deg, #fff 0%, #7c3aed 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          {step === "plans" ? "Choose Your Plan" : "Create Your Account"}
        </h1>
        <p style={{ color: "#888", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
          {step === "plans" 
            ? "Start creating AI-powered content today. No credit card required for free plan."
            : `You selected the ${plans.find(p => p.id === selectedPlan)?.name} plan`
          }
        </p>
      </div>

      {step === "plans" ? (
        /* Pricing Cards */
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px"
        }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                backgroundColor: "#111",
                borderRadius: "16px",
                padding: "32px",
                border: plan.popular ? "2px solid #7c3aed" : "1px solid #222",
                position: "relative",
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "pointer"
              }}
              onClick={() => handlePlanSelect(plan.id)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                if (!plan.popular) e.currentTarget.style.borderColor = "#444";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                if (!plan.popular) e.currentTarget.style.borderColor = "#222";
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#7c3aed",
                  padding: "4px 16px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}>
                {plan.name}
              </h3>
              
              <div style={{ marginBottom: "16px" }}>
                {plan.price === -1 ? (
                  <span style={{ fontSize: "36px", fontWeight: "bold" }}>Custom</span>
                ) : (
                  <>
                    <span style={{ fontSize: "48px", fontWeight: "bold" }}>${plan.price}</span>
                    <span style={{ color: "#888", fontSize: "16px" }}>{plan.period}</span>
                  </>
                )}
              </div>

              <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
                {plan.description}
              </p>

              <ul style={{ listStyle: "none", padding: 0, marginBottom: "32px" }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    marginBottom: "12px",
                    fontSize: "14px",
                    color: "#ccc"
                  }}>
                    <span style={{ color: "#22c55e" }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: plan.popular ? "#7c3aed" : "#1a1a1a",
                  color: "white",
                  border: plan.popular ? "none" : "1px solid #333",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Account Creation Form */
        <div style={{
          maxWidth: "450px",
          margin: "0 auto",
          backgroundColor: "#111",
          borderRadius: "16px",
          padding: "40px",
          border: "1px solid #222"
        }}>
          <form onSubmit={handleCreateAccount}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Choose a username"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#bbb", fontSize: "14px" }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="At least 8 characters"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#0a0a0a",
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
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm your password"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#0a0a0a",
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
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginBottom: "16px"
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => setStep("plans")}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "transparent",
                color: "#888",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              ← Back to Plans
            </button>
          </form>

          <div style={{ 
            marginTop: "24px", 
            paddingTop: "24px", 
            borderTop: "1px solid #222",
            textAlign: "center"
          }}>
            <p style={{ color: "#666", fontSize: "13px" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#7c3aed" }}>Sign in</Link>
            </p>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div style={{
        maxWidth: "800px",
        margin: "80px auto 0",
        textAlign: "center"
      }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>Frequently Asked Questions</h2>
        <p style={{ color: "#888", marginBottom: "40px" }}>
          Have questions? We've got answers.
        </p>

        <div style={{ textAlign: "left" }}>
          {[
            {
              q: "Can I change my plan later?",
              a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle."
            },
            {
              q: "Is there a free trial?",
              a: "The Starter plan is free forever. For paid plans, we offer a 14-day money-back guarantee."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
            },
            {
              q: "Can I cancel anytime?",
              a: "Absolutely. No long-term contracts. Cancel anytime from your account settings."
            }
          ].map((faq, i) => (
            <div key={i} style={{
              marginBottom: "24px",
              padding: "20px",
              backgroundColor: "#111",
              borderRadius: "12px",
              border: "1px solid #222"
            }}>
              <h4 style={{ marginBottom: "8px", fontSize: "16px" }}>{faq.q}</h4>
              <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
