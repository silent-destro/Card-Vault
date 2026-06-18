"use client";
import { useState } from "react";

const PLANS = [
  {
    name: "Free Trial",
    priceText: "₹30",
    periodText: "/2 days",
    desc: "Test drive CardVault features",
    features: [
      "1 digital card",
      "3 card themes",
      "AI reviews: 10/month",
      "QR code",
      "Basic analytics (views only)",
      "CardVault branding shown",
    ],
    cta: "Purchase Trial",
    featured: false,
    badge: null,
    planId: "free"
  },
  {
    name: "Pro",
    price: { monthly: 99, yearly: 79 },
    desc: "Everything growing businesses need",
    features: [
      "2 digital cards",
      "All 8 themes",
      "Unlimited AI reviews",
      "Full analytics dashboard",
      "Product catalog (20 items)",
      "Appointment booking",
      "Photo gallery (8 photos)",
      "Review notifications (email)",
      "Custom card slug",
    ],
    cta: "Buy Pro Plan",
    featured: true,
    badge: "Most Popular",
    planId: "pro"
  },
  {
    name: "Business",
    price: { monthly: 249, yearly: 199 },
    desc: "For agencies and power users",
    features: [
      "4 digital cards",
      "All 8 premium themes",
      "Unlimited AI reviews",
      "Full analytics dashboard",
      "Unlimited catalog items",
      "Appointment booking",
      "Photo gallery",
      "White-label (no branding)",
      "Review notifications (email + WhatsApp)",
      "Priority WhatsApp support",
    ],
    cta: "Buy Business Plan",
    featured: false,
    badge: null,
    planId: "business"
  },
];

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const getWhatsAppLink = (planName: string, isYearly: boolean) => {
    return `https://wa.me/919925531531`;
  };

  return (
    <section id="pricing" className="section" style={{ background: "var(--bg-base)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>Simple Pricing</span>
          </div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Start Trial, <em className="gold">Grow Fast</em>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "32px" }}>
            Select a plan to buy. Direct activation via WhatsApp.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-full)", padding: "4px" }}>
            <button
              onClick={() => setYearly(false)}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-full)",
                border: "none",
                background: !yearly ? "var(--gold)" : "transparent",
                color: !yearly ? "#080808" : "var(--text-secondary)",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-full)",
                border: "none",
                background: yearly ? "var(--gold)" : "transparent",
                color: yearly ? "#080808" : "var(--text-secondary)",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Yearly <span style={{ fontSize: "11px", background: "rgba(0,0,0,0.15)", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>2 months FREE</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="pricing-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}>
          {PLANS.map((plan) => {
            const isTrial = plan.planId === "free";
            return (
              <div
                key={plan.name}
                style={{
                  background: "var(--bg-card)",
                  border: plan.featured ? "1px solid var(--gold-dark)" : "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "32px",
                  position: "relative",
                  boxShadow: plan.featured ? "var(--shadow-gold)" : "var(--shadow-card)",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.borderColor = "var(--gold)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = plan.featured ? "var(--gold-dark)" : "var(--bg-border)";
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)" }}>
                    <span className="badge-premium">{plan.badge}</span>
                  </div>
                )}

                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", marginBottom: "6px" }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{plan.desc}</p>
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 300, fontSize: "14px", color: "var(--text-secondary)" }}>₹</span>
                    <span className="text-display-lg" style={{ fontSize: "40px", color: "var(--text-primary)", fontWeight: 700 }}>
                      {isTrial
                        ? "30"
                        : yearly
                        ? plan.price ? plan.price.yearly * 12 : 0
                        : plan.price ? plan.price.monthly : 0}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      {isTrial
                        ? plan.periodText
                        : yearly
                        ? "/year"
                        : "/month"}
                    </span>
                  </div>
                  {!isTrial && plan.price && (
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                      {yearly 
                        ? `Equivalent to ₹${plan.price.yearly}/mo billed annually` 
                        : `Or ₹${plan.price.yearly * 12}/yr when billed yearly`}
                    </p>
                  )}
                </div>

                <a
                  href={getWhatsAppLink(plan.name, yearly)}
                  target="_blank"
                  className={plan.featured ? "btn-primary" : "btn-secondary"}
                  style={{ display: "block", textAlign: "center", marginBottom: "28px", textDecoration: "none" }}
                >
                  {plan.cta}
                </a>

                <div style={{ borderTop: "1px solid var(--bg-border)", paddingTop: "20px" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px" }}>
                      <span style={{ color: "var(--gold)", fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 400px; margin: 0 auto; }
        }
      `}</style>
    </section>
  );
}
