"use client";
import Link from "next/link";

export default function CTASection() {
  return (
    <section style={{ position: "relative", padding: "96px 0", overflow: "hidden" }}>
      {/* Background gradient */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #0A0A0A 0%, #1A1200 50%, #0A0A0A 100%)",
        zIndex: 0,
      }} />

      {/* Floating shapes */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        {[
          { top: "10%", left: "5%", size: 120, opacity: 0.06 },
          { top: "60%", left: "90%", size: 200, opacity: 0.04 },
          { top: "30%", right: "10%", size: 80, opacity: 0.08 },
          { top: "70%", left: "15%", size: 60, opacity: 0.06 },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            border: "1px solid var(--gold)",
            borderRadius: "50%",
            opacity: s.opacity,
            animation: `float ${4 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }} />
        ))}
      </div>

      {/* Gold glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "300px",
        background: "radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, transparent 70%)",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--gold-glow)",
          border: "1px solid rgba(212,168,67,0.25)",
          borderRadius: "var(--radius-full)",
          padding: "6px 16px",
          marginBottom: "28px",
        }}>
          <span style={{ fontSize: "11px", color: "var(--gold)", fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            🚀 Free Forever Plan Available
          </span>
        </div>

        <h2 className="text-display-xl" style={{ color: "var(--text-primary)", marginBottom: "20px" }}>
          Ready to Take Your<br />
          Business <em className="gold">Digital?</em>
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: "18px", lineHeight: 1.7, maxWidth: "500px", margin: "0 auto 40px" }}>
          Join 5,000+ Indian businesses who already have a stunning digital presence. Create your card in 5 minutes — free.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/sign-up" className="btn-primary" style={{ fontSize: "17px", padding: "18px 40px" }}>
            Create My Free Card →
          </Link>
          <Link href="/demo" className="btn-secondary" style={{ fontSize: "17px", padding: "18px 40px" }}>
            See Live Demo
          </Link>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "24px" }}>
          No credit card required · Setup in 5 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}
