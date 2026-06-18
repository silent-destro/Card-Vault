"use client";

export default function Testimonials() {
  return (
    <section className="section" style={{ background: "var(--bg-base)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>Real Stories</span>
          </div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Businesses <em className="gold">Love CardVault</em>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "480px", margin: "0 auto" }}>
            Real stories from real businesses are on their way. Stay tuned!
          </p>
        </div>

        {/* Coming Soon Placeholder */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 32px",
          background: "var(--bg-card)",
          border: "1px dashed rgba(212,168,67,0.3)",
          borderRadius: "var(--radius-xl)",
          flexDirection: "column",
          gap: "16px",
        }}>
          <div style={{ fontSize: "52px" }}>⭐</div>
          <h3 style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            color: "var(--text-primary)",
            margin: 0,
          }}>
            Stories Coming Soon
          </h3>
          <p style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            maxWidth: "360px",
            textAlign: "center",
            lineHeight: 1.7,
            margin: 0,
          }}>
            We&apos;re collecting real success stories from CardVault users. Check back soon to see how businesses are growing with their digital cards.
          </p>
          <div style={{
            display: "flex",
            gap: "8px",
            marginTop: "8px",
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: i === 1 ? "var(--gold)" : "var(--bg-border)",
                animation: `dot-pulse ${i * 0.3 + 0.6}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dot-pulse {
          0% { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </section>
  );
}
