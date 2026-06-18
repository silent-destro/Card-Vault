"use client";

const STEPS = [
  {
    num: "01",
    icon: "📝",
    title: "Fill Your Details",
    desc: "Enter your business name, contact info, social links, and business hours. Takes less than 5 minutes.",
    color: "var(--gold)",
  },
  {
    num: "02",
    icon: "🎨",
    title: "Pick Your Theme",
    desc: "Choose from 8 stunning card themes. See a live preview as you customize — no design skills needed.",
    color: "#A78BFA",
  },
  {
    num: "03",
    icon: "📲",
    title: "Share & Collect Reviews",
    desc: "Share your card via WhatsApp, QR code, or link. Customers visit and write AI-powered reviews in seconds.",
    color: "#34D399",
  },
];

export default function HowItWorks() {
  return (
    <section className="section" style={{ background: "var(--bg-base)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>Simple Process</span>
          </div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Live in <em className="gold">3 Steps</em>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            No developer, no designer, no complicated setup.
          </p>
        </div>

        {/* Steps */}
        <div style={{ position: "relative" }}>
          {/* Connector line (desktop) */}
          <div className="steps-connector" style={{
            position: "absolute",
            top: "48px",
            left: "calc(16.67% + 48px)",
            right: "calc(16.67% + 48px)",
            height: "2px",
            background: "linear-gradient(90deg, var(--gold), #A78BFA, #34D399)",
            opacity: 0.3,
            borderRadius: "2px",
          }} />

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ textAlign: "center", position: "relative" }}>
                {/* Number badge */}
                <div style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  background: `${step.color}18`,
                  border: `2px solid ${step.color}40`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  position: "relative",
                  zIndex: 1,
                  transition: "all 0.3s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${step.color}30`;
                    (e.currentTarget as HTMLElement).style.border = `2px solid ${step.color}80`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = `${step.color}18`;
                    (e.currentTarget as HTMLElement).style.border = `2px solid ${step.color}40`;
                  }}
                >
                  <span style={{ fontSize: "32px", marginBottom: "4px" }}>{step.icon}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: step.color, fontWeight: 400 }}>{step.num}</span>
                </div>

                <h3 style={{
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                }}>
                  {step.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, maxWidth: "240px", margin: "0 auto" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .steps-connector { display: none !important; }
        }
      `}</style>
    </section>
  );
}
