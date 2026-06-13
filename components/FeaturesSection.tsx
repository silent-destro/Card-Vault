"use client";
import { useRef, useEffect, useState } from "react";

const FEATURES = [
  { icon: "🃏", title: "Digital Business Card", desc: "Themed card with all info, buttons, and links — shareable in seconds." },
  { icon: "🤖", title: "AI Review Generator", desc: "3 variants, tone control, English/Hindi/Gujarati — customers always find their voice." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Views, clicks, conversions, devices, geography — all in real-time." },
  { icon: "🔲", title: "QR Code Generator", desc: "Custom color, PNG/SVG download, print-ready for tables and windows." },
  { icon: "🎨", title: "8 Card Themes", desc: "Dark Luxury, Purple Vibrant, Minimal White, and 5 more — live preview." },
  { icon: "🛍", title: "Product Catalog", desc: "Up to 20 products with images, prices, and category grouping." },
  { icon: "💳", title: "UPI Pay Button", desc: "Direct payment via UPI, GPay, PhonePe from the card." },
  { icon: "📅", title: "Appointment Booking", desc: "Simple form with WhatsApp confirmation to the business owner." },
  { icon: "📸", title: "Photo Gallery", desc: "Up to 8 swipeable business photos with pinch-to-zoom." },
  { icon: "💾", title: "Save Contact (vCard)", desc: ".vcf file download in one tap — saved directly to phone contacts." },
  { icon: "🟢", title: "Live Business Hours", desc: "\"Open Now\" / \"Closed\" real-time status with your business schedule." },
  { icon: "💬", title: "WhatsApp Channel Button", desc: "Direct link with pre-filled message support for instant contact." },
  { icon: "🔗", title: "Custom Card Slug", desc: "cardvault.in/yourbusiness — memorable, shareable URL." },
  { icon: "🌐", title: "Multi-language Card", desc: "English + Hindi/Gujarati toggle for local and national audiences." },
  { icon: "📤", title: "One-Tap Share", desc: "Native share sheet: WhatsApp, SMS, Copy link, Email." },
  { icon: "⭐", title: "Review Badge", desc: "Embeddable \"X Reviews\" badge for your website." },
  { icon: "🔔", title: "Review Notifications", desc: "Email + WhatsApp alert every time a new review is posted." },
  { icon: "🖥", title: "Embed Widget", desc: "One line of code to embed your card on any website." },
  { icon: "✅", title: "Verified Business Badge", desc: "Trust indicator shown prominently on your card." },
  { icon: "📎", title: "Link In Bio", desc: "Your card also serves as the perfect Instagram/WhatsApp bio link." },
];

export default function FeaturesSection() {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(Array(FEATURES.length).fill(false));

  useEffect(() => {
    const observers = itemRefs.current.map((el, i) => {
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisible(prev => { const next = [...prev]; next[i] = true; return next; });
            }, (i % 3) * 80);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <section id="features" className="section" style={{ background: "var(--bg-base)" }}>
      <div className="container">
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            <span className="text-caption" style={{ color: "var(--text-muted)" }}>Everything You Need</span>
          </div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            21 Features, <em className="gold">One Card</em>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "480px", margin: "0 auto" }}>
            Everything your business needs to go digital — no website, no developer, no design skills required.
          </p>
        </div>

        {/* Features grid */}
        <div className="features-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}>
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              ref={el => { itemRefs.current[i] = el; }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                transition: "all 0.3s ease-out",
                cursor: "default",
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? "translateY(0)" : "translateY(30px)",
                transitionDelay: `${(i % 3) * 0.06}s`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "var(--shadow-gold)";
                el.style.borderColor = "rgba(212,168,67,0.3)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "";
                el.style.borderColor = "var(--bg-border)";
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{feat.icon}</div>
              <h3 style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: "15px",
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
