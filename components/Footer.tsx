"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--bg-card)",
      borderTop: "1px solid var(--bg-border)",
      padding: "64px 0 32px",
    }}>
      <div className="container">
        {/* Top Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "48px",
          marginBottom: "48px",
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "24px", color: "var(--text-primary)" }}>Card</span>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "24px", color: "var(--gold)" }}>Vault</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, maxWidth: "280px", marginBottom: "0px" }}>
              Create your digital business card in 5 minutes. Share it anywhere. Watch your reviews grow automatically.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Product</h4>
            <FooterLink href="#features">Features</FooterLink>
            <FooterLink href="#pricing">Pricing</FooterLink>
            <FooterLink href="/demo">Live Demo</FooterLink>
            <FooterLink href="#themes">Card Themes</FooterLink>
            <FooterLink href="#ai-reviews">AI Reviews</FooterLink>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Company</h4>
            <FooterLink href="/about">About Us</FooterLink>
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/careers">Careers</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Legal</h4>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/refund">Refund Policy</FooterLink>
            <FooterLink href="/cookie-policy">Cookie Policy</FooterLink>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{
          paddingTop: "24px",
          borderTop: "1px solid var(--bg-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            © 2026 CardVault. All rights reserved.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            This website is made by <span style={{ color: "var(--gold)", fontWeight: 600 }}>Dhairya Jesani</span>
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Made with ❤️ in India 🇮🇳
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
          footer > div > div:first-child > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          footer > div > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <Link
        href={href}
        style={{
          color: "var(--text-secondary)",
          fontSize: "14px",
          textDecoration: "none",
          transition: "color 0.2s",
          display: "inline-block",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        {children}
      </Link>
    </div>
  );
}


