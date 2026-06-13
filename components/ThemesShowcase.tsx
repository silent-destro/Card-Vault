"use client";
import { useState } from "react";

const THEMES = [
  { id: "dark-luxury", name: "Dark Luxury", bg: "linear-gradient(145deg, #181412, #090707)", accent: "#E5C17C", text: "#F5F5F0", textSec: "#A8A09A", btnBg: "#E5C17C", btnText: "#181412", best: "Jewelry, Luxury" },
  { id: "rose-gold", name: "Rose Gold", bg: "linear-gradient(145deg, #1F1412, #0D0807)", accent: "#FDA4AF", text: "#FFF1F2", textSec: "#FCA5A5", btnBg: "#FDA4AF", btnText: "#1F1412", best: "Boutiques, Salons" },
  { id: "minimal-white", name: "Minimal White", bg: "#FFFFFF", accent: "#0F172A", text: "#0F172A", textSec: "#475569", btnBg: "#0F172A", btnText: "#FFFFFF", best: "Corporate, Professionals" },
  { id: "teal-ocean", name: "Teal Ocean", bg: "linear-gradient(145deg, #051B1B, #010808)", accent: "#2DD4BF", text: "#F0FDFA", textSec: "#99F6E4", btnBg: "#2DD4BF", btnText: "#010808", best: "Agencies, SaaS" },
  { id: "navy-pro", name: "Navy Professional", bg: "linear-gradient(145deg, #080F1E, #02050B)", accent: "#7DD3FC", text: "#F0F9FF", textSec: "#BAE6FD", btnBg: "#7DD3FC", btnText: "#02050B", best: "Finance, Legal" },
  { id: "burgundy-velvet", name: "Burgundy Velvet", bg: "linear-gradient(145deg, #2A0914, #0F0206)", accent: "#F43F5E", text: "#FFF1F2", textSec: "#FECDD3", btnBg: "#F43F5E", btnText: "#0F0206", best: "Fine Dining, Wineries" },
  { id: "neon-city", name: "Neon City", bg: "linear-gradient(145deg, #05000C, #000000)", accent: "#00F5FF", text: "#E0FBFF", textSec: "#7DD9E5", btnBg: "#00F5FF", btnText: "#05000C", best: "Tech, Studios" },
  { id: "royal-gold", name: "Royal Gold", bg: "linear-gradient(145deg, #181512, #080706)", accent: "#FBBF24", text: "#FFF8E7", textSec: "#D4C07A", btnBg: "#FBBF24", btnText: "#080706", best: "Premium, Estates" },
];

export default function ThemesShowcase() {
  const [activeTheme, setActiveTheme] = useState(0);
  const theme = THEMES[activeTheme];

  return (
    <section id="themes" className="section" style={{ background: "var(--bg-card)", overflow: "hidden" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>Card Themes</span>
          </div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            8 Stunning <em className="gold">Themes</em>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Every card theme is designed by professionals. Click any theme to preview it live.
          </p>
        </div>

        <div className="themes-grid-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          {/* Theme selector */}
          <div className="theme-selector-panel">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTheme(i)}
                  style={{
                    background: i === activeTheme ? "var(--bg-elevated)" : "var(--bg-base)",
                    border: i === activeTheme ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: t.bg,
                    border: `2px solid ${t.accent}`,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: i === activeTheme ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.best}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "260px",
              background: theme.bg,
              borderRadius: "24px",
              padding: "20px",
              border: `1px solid ${theme.accent}40`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${theme.accent}20`,
              transition: "all 0.4s ease-out",
            }}>
              {/* Header */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${theme.accent}30`, border: `1px solid ${theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                    🏪
                  </div>
                  <div>
                    <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "14px", color: theme.text }}>My Business</div>
                    <div style={{ fontSize: "11px", color: theme.textSec }}>Category · City</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ color: theme.accent, fontSize: "11px" }}>★</span>)}
                  <span style={{ fontSize: "10px", color: theme.textSec, marginLeft: "4px" }}>4.9 (124)</span>
                </div>
              </div>

              <div style={{ height: "1px", background: `${theme.accent}20`, marginBottom: "12px" }} />

              {/* Tagline */}
              <p style={{ fontSize: "11px", color: theme.textSec, marginBottom: "12px", lineHeight: 1.5 }}>
                Rajkot&apos;s finest electronics store since 1995
              </p>

              {/* Open badge */}
              <div style={{ marginBottom: "12px" }}>
                <span style={{
                  background: `rgba(34,197,94,0.12)`,
                  color: "#22C55E",
                  border: "1px solid rgba(34,197,94,0.25)",
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "999px",
                }}>
                  🟢 Open Now
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                {["📞 Call", "💬 Chat", "✉ Email"].map(label => (
                  <div key={label} style={{
                    background: `${theme.accent}15`,
                    border: `1px solid ${theme.accent}30`,
                    borderRadius: "8px",
                    padding: "6px 4px",
                    textAlign: "center",
                    fontSize: "9px",
                    color: theme.text,
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 500,
                  }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Review button */}
              <div style={{
                background: theme.btnBg,
                color: theme.btnText,
                borderRadius: "8px",
                padding: "8px",
                textAlign: "center",
                fontSize: "11px",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}>
                ⭐ Write a Review
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .themes-grid-container {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .theme-selector-panel {
            display: block !important;
          }
          .theme-selector-panel > div {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .theme-selector-panel > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
