"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUserAction, updateUserPlanAction } from "@/app/card/actions";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    features: [
      "1 digital business card",
      "3 themes (Dark Luxury, Purple Vibrant, Minimal White)",
      "10 AI reviews per month",
      "Basic analytics (Last 7 days views only)",
      "Auto-generated card URL slug",
      "CardVault branding on card",
      "UPI payment button",
      "Social media links",
    ],
    locked: [],
  },
  {
    key: "pro",
    name: "Pro",
    price: { monthly: 99, yearly: 79 },
    featured: true,
    badge: "Most Popular",
    features: [
      "Up to 2 digital business cards",
      "All 8 premium themes",
      "Unlimited AI reviews",
      "30 days analytics history limit",
      "Button click breakdown & device split",
      "Custom card URL slug",
      "Product catalog (up to 20 items)",
      "Appointment booking & WhatsApp alerts",
      "Customer Details Form (WhatsApp only)",
      "Photo gallery & UPI pay button",
    ],
    locked: [],
  },
  {
    key: "business",
    name: "Business",
    price: { monthly: 249, yearly: 199 },
    features: [
      "Up to 4 digital business cards",
      "All 8 premium themes",
      "Unlimited AI reviews",
      "Full analytics (90 days, All time)",
      "Google Sheets & Google Forms Sync",
      "Export bookings/leads to CSV",
      "Unlimited catalog items",
      "Appointment booking & WhatsApp alerts",
      "No CardVault branding (white-label)",
      "Priority support",
    ],
    locked: [],
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUserAction();
        if (user) {
          setCurrentPlan(user.plan);
          if (user.plan !== "free" && user.expiresAt) {
            setExpiresAt(user.expiresAt);
            const exp = new Date(user.expiresAt);
            const diff = exp.getTime() - Date.now();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setDaysRemaining(days > 0 ? days : 0);
          } else {
            setExpiresAt(null);
            setDaysRemaining(null);
          }
        }
      } catch (err) {
        console.error("Failed to load billing info:", err);
      } finally {
        setLoading(false);
      }
    }
    load();

    try {
      const draft = sessionStorage.getItem("cardvault_create_draft");
      if (draft) {
        setTimeout(() => setHasDraft(true), 0);
      }
    } catch (e) {}
  }, []);

  const formatDate = (expiryStr: string | null) => {
    if (!expiryStr) return "";
    return new Date(expiryStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        {hasDraft ? (
          <Link href="/dashboard/create" style={{ fontSize: "13px", color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
            ← Return to Card Creator (Draft Saved)
          </Link>
        ) : (
          <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← Dashboard
          </Link>
        )}
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "8px", marginBottom: "4px" }}>Billing & Plans</h1>
        {!loading && (
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Current Plan:{" "}
            <span style={{
              color: currentPlan === "business" ? "#34D399" : currentPlan === "pro" ? "#A78BFA" : "var(--gold)",
              fontWeight: 600,
              textTransform: "capitalize"
            }}>
              {currentPlan}
            </span>
            {expiresAt && (
              <span style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: "10px" }}>
                (Valid till {formatDate(expiresAt)} · {daysRemaining !== null ? `${daysRemaining} days left` : ""})
              </span>
            )}
          </p>
        )}
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-full)", padding: "4px" }}>
          <button
            onClick={() => setBillingCycle("monthly")}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: billingCycle === "monthly" ? "var(--gold)" : "transparent",
              color: billingCycle === "monthly" ? "#080808" : "var(--text-secondary)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: billingCycle === "yearly" ? "var(--gold)" : "transparent",
              color: billingCycle === "yearly" ? "#080808" : "var(--text-secondary)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Yearly <span style={{ fontSize: "10px", background: "rgba(0,0,0,0.15)", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>2 months FREE</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite" }} />
        </div>
      ) : (
        <div className="billing-plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan;
            const priceVal = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

            return (
              <div
                key={plan.key}
                style={{
                  background: "var(--bg-card)",
                  border: plan.featured
                    ? "1px solid var(--gold-dark)"
                    : isCurrent
                    ? (currentPlan === "business" ? "1px solid rgba(52,211,153,0.4)" : currentPlan === "pro" ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(34,197,94,0.3)")
                    : "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "28px",
                  position: "relative",
                  boxShadow: plan.featured ? "var(--shadow-gold)" : "var(--shadow-card)",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)" }}>
                    <span className="badge-premium">{plan.badge}</span>
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: "absolute", top: "-12px", right: "20px" }}>
                    <span style={{
                      background: currentPlan === "business" ? "rgba(52,211,153,0.12)" : currentPlan === "pro" ? "rgba(167,139,250,0.12)" : "rgba(34,197,94,0.12)",
                      color: currentPlan === "business" ? "#34D399" : currentPlan === "pro" ? "#A78BFA" : "#22C55E",
                      border: `1px solid ${currentPlan === "business" ? "rgba(52,211,153,0.3)" : currentPlan === "pro" ? "rgba(167,139,250,0.3)" : "rgba(34,197,94,0.3)"}`,
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600
                    }}>
                      ✓ Current Plan
                    </span>
                  </div>
                )}

                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", marginBottom: "8px" }}>{plan.name}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 300, fontSize: "14px", color: "var(--text-secondary)" }}>₹</span>
                    <span style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 300, fontSize: "44px", color: "var(--text-primary)" }}>{priceVal}</span>
                    {priceVal > 0 && <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>/mo</span>}
                  </div>
                  {billingCycle === "yearly" && plan.price.monthly > 0 && (
                    <span style={{ color: "var(--gold)", fontSize: "12px", fontWeight: 500, fontFamily: "Outfit, sans-serif" }}>
                      Billed yearly (₹{priceVal * 12}/yr) · Save ₹{(plan.price.monthly - plan.price.yearly) * 12}/yr
                    </span>
                  )}
                </div>

                {isCurrent ? (
                  <button disabled style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-full)", color: "var(--text-muted)", fontSize: "14px", fontFamily: "Outfit, sans-serif", fontWeight: 600, cursor: "not-allowed", marginBottom: "20px" }}>
                    Current Plan
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", marginBottom: "20px", background: plan.featured ? "var(--gold)" : "var(--bg-elevated)", border: plan.featured ? "none" : "1px solid var(--bg-border)", color: plan.featured ? "#000" : "var(--text-primary)" }}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await updateUserPlanAction(plan.key, billingCycle);
                        if (res.success) {
                          alert(`Plan switched to ${plan.name} (${billingCycle === "yearly" ? "Yearly" : "Monthly"}) successfully! Expiration date extended by ${billingCycle === "yearly" ? "365" : "30"} days.`);
                          window.location.reload();
                        }
                      } catch (err) {
                        alert("Failed to switch plan. Please try again.");
                        setLoading(false);
                      }
                    }}
                  >
                    Switch to {plan.name}
                  </button>
                )}

                <div style={{ borderTop: "1px solid var(--bg-border)", paddingTop: "16px" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span style={{ color: "var(--gold)", fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{f}</span>
                    </div>
                  ))}
                  {plan.locked && plan.locked.map(f => (
                    <div key={f} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", opacity: 0.4 }}>
                      <span style={{ fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>🔒</span>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin360 { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .billing-plans-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
}
