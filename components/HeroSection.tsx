"use client";
import { useEffect, useRef, useState } from "react";

const PHRASES = ["Your Business in One Tap", "Share Anywhere, Anytime", "Reviews That Write Themselves"];

export default function HeroSection() {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typewriter effect
  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!deleting && charIndex < currentPhrase.length) {
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 65);
    } else if (!deleting && charIndex === currentPhrase.length) {
      timeout = setTimeout(() => setDeleting(true), 2500);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, 35);
    } else if (deleting && charIndex === 0) {
      timeout = setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((phraseIndex + 1) % PHRASES.length);
      }, 200);
    }
    return () => clearTimeout(timeout);
  }, [charIndex, deleting, phraseIndex]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(interval);
  }, []);

  // Scroll-based parallax on phone
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const phone = containerRef.current.querySelector(".hero-phone") as HTMLElement;
        if (phone) {
          phone.style.transform = `translateY(${-window.scrollY * 0.08}px)`;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={containerRef} style={{ position: "relative", overflow: "hidden", paddingTop: "80px", paddingBottom: "80px", minHeight: "90vh", display: "flex", alignItems: "center" }}>
      {/* Background particles */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <ParticleBackground />
      </div>

      {/* Radial gradient glow */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, transparent 70%)",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "1200px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "64px",
          alignItems: "center",
        }}>
          {/* Left: Text */}
          <div>
            {/* Badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--gold-glow)",
              border: "1px solid rgba(212,168,67,0.25)",
              borderRadius: "var(--radius-full)",
              padding: "6px 16px",
              marginBottom: "28px",
              animation: "fadeUp 0.4s ease-out 0.1s both",
            }}>
              <span style={{ fontSize: "11px", color: "var(--gold)", fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                ✨ Trusted by 5,000+ Businesses
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-display-xl" style={{
              color: "var(--text-primary)",
              marginBottom: "24px",
              animation: "fadeUp 0.6s ease-out 0.2s both",
            }}>
              {displayText}
              <span style={{ color: "var(--gold)", opacity: showCursor ? 1 : 0, transition: "opacity 0.1s" }}>|</span>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: "17px",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "480px",
              marginBottom: "36px",
              animation: "fadeUp 0.6s ease-out 0.4s both",
            }}>
              Create a stunning digital card in 5 minutes. Share it via WhatsApp, QR, or link.
              Collect 5-star reviews — <em style={{ color: "var(--gold)", fontStyle: "normal", fontWeight: 600 }}>automatically.</em>
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "36px",
              animation: "fadeUp 0.6s ease-out 0.6s both",
            }}>
              <a href="/sign-up" className="btn-primary" style={{ fontSize: "16px", padding: "16px 32px" }}>
                Create My Free Card →
              </a>
              <a href="/demo" className="btn-secondary" style={{ fontSize: "16px", padding: "16px 32px" }}>
                See It Live
              </a>
            </div>

            {/* Social proof */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              animation: "fadeUp 0.6s ease-out 0.8s both",
            }}>
              <div style={{ display: "flex" }}>
                {["🏪", "💇", "🍕", "💼", "🏥"].map((emoji, i) => (
                  <div key={i} style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--bg-elevated)",
                    border: "2px solid var(--bg-base)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    marginLeft: i > 0 ? "-8px" : "0",
                  }}>
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: "#F0C96B", fontSize: "13px" }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>5,000+ businesses across India</p>
              </div>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
            <div className="hero-phone animate-float" style={{ position: "relative" }}>
              <PhoneMockup />
              {/* Orbit icons */}
              <OrbitIcon emoji="⭐" delay="0s" />
              <OrbitIcon emoji="💬" delay="-5s" />
              <OrbitIcon emoji="📱" delay="-10s" />
              <OrbitIcon emoji="🔗" delay="-15s" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          section > div > div { grid-template-columns: 1fr !important; gap: 32px !important; }
          section > div > div > div:last-child {
            display: flex !important;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}

interface Particle {
  cx: string;
  cy: string;
  r: number;
  fill: string;
  opacity: number;
  duration: number;
  delay: number;
}

function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 40 }).map(() => ({
      cx: `${Math.random() * 100}%`,
      cy: `${Math.random() * 100}%`,
      r: Math.random() * 1.5 + 0.5,
      fill: Math.random() > 0.5 ? "var(--gold)" : "#fff",
      opacity: Math.random() * 0.6 + 0.2,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 4,
    }));
    setTimeout(() => setParticles(generated), 0);
  }, []);

  if (particles.length === 0) {
    return null;
  }

  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.fill}
          opacity={p.opacity}
          style={{
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div style={{
      width: "280px",
      background: "linear-gradient(145deg, #1A1200 0%, #0A0A0A 100%)",
      border: "1px solid rgba(212,168,67,0.3)",
      borderRadius: "32px",
      padding: "20px 16px",
      boxShadow: "0 0 60px rgba(212,168,67,0.15), 0 40px 80px rgba(0,0,0,0.6)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Phone notch */}
      <div style={{ width: "80px", height: "6px", background: "#1a1a1a", borderRadius: "3px", margin: "0 auto 20px" }} />

      {/* Card header */}
      <div style={{ background: "linear-gradient(135deg, #D4A843, #8C6E20)", borderRadius: "16px", padding: "16px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏪</div>
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "#080808" }}>Patel Electronics</div>
            <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.6)" }}>Electronics · Rajkot</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#431407", fontSize: "11px" }}>★</span>)}
          <span style={{ fontSize: "10px", color: "rgba(0,0,0,0.6)", marginLeft: "4px" }}>4.9 (124)</span>
        </div>
      </div>

      {/* Status */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
        <span className="badge-open" style={{ fontSize: "11px" }}>
          <span className="open-dot" />
          Open Now · Closes 9 PM
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {[
          { icon: "📞", label: "Call" },
          { icon: "💬", label: "WhatsApp" },
          { icon: "✉", label: "Email" },
        ].map(btn => (
          <div key={btn.label} style={{
            background: "rgba(212,168,67,0.12)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: "10px",
            padding: "8px 4px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "16px", marginBottom: "3px" }}>{btn.icon}</div>
            <div style={{ fontSize: "9px", color: "var(--gold-light)", fontFamily: "Outfit, sans-serif", fontWeight: 500 }}>{btn.label}</div>
          </div>
        ))}
      </div>

      {/* Review button */}
      <div style={{
        background: "linear-gradient(135deg, #D4A843, #F0C96B)",
        borderRadius: "10px",
        padding: "10px",
        textAlign: "center",
        marginBottom: "12px",
      }}>
        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "12px", color: "#080808" }}>⭐ Write a Review</span>
      </div>

      {/* Social icons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        {["📸", "👤", "▶", "💼"].map((icon, i) => (
          <div key={i} style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
          }}>
            {icon}
          </div>
        ))}
      </div>

      {/* Bottom glow */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "60%",
        height: "1px",
        background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
      }} />
    </div>
  );
}

function OrbitIcon({ emoji, delay }: { emoji: string; delay: string }) {
  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "36px",
      height: "36px",
      marginTop: "-18px",
      marginLeft: "-18px",
      animation: `orbitSpin 20s linear infinite`,
      animationDelay: delay,
    }}>
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
        borderRadius: "50%",
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}>
        {emoji}
      </div>
    </div>
  );
}
