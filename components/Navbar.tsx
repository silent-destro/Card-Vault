"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    if (typeof window !== "undefined") {
      setIsLoggedIn(sessionStorage.getItem("cv_session_active") === "true");
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="navbar" style={{ boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "1200px" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "22px", color: "var(--text-primary)" }}>Card</span>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "22px", color: "var(--gold)" }}>Vault</span>
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <NavLink href="/#features">Features</NavLink>
          <NavLink href="/#pricing">Pricing</NavLink>
          <NavLink href="/demo">Demo</NavLink>
        </div>

        {/* Desktop CTA */}
        <div className="desktop-cta" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--gold)",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(212,168,67,0.3)",
                background: "var(--gold-glow)",
                transition: "all 0.2s"
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-in"
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--bg-border)",
                background: "rgba(255, 255, 255, 0.03)",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
            >
              Sign In
            </Link>
          )}
          <a
            href="https://wa.me/919925531531?text=Hello%20CardVault%20Team!%20I'm%20interested%20in%20creating%20a%20digital%20business%20card%20for%20my%20business.%20I%20would%20like%20to%20get%20more%20information%20about%20your%20premium%20features%20and%20plans.%20Thank%20you!"
            target="_blank"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#080808",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--gold)",
              boxShadow: "0 0 12px rgba(212, 175, 55, 0.3)",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            Inquiry
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "var(--text-primary)",
          }}
          aria-label="Toggle menu"
        >
          <div style={{ width: "22px", height: "2px", background: "currentColor", marginBottom: "5px", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <div style={{ width: "22px", height: "2px", background: "currentColor", marginBottom: "5px", transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
          <div style={{ width: "22px", height: "2px", background: "currentColor", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: "absolute",
          top: "64px",
          left: 0,
          right: 0,
          background: "rgba(8,8,8,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--bg-border)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "fadeUp 0.2s ease-out",
          zIndex: 99,
        }}>
          <MobileNavLink href="/#features" onClick={() => setMenuOpen(false)}>Features</MobileNavLink>
          <MobileNavLink href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</MobileNavLink>
          <MobileNavLink href="/demo" onClick={() => setMenuOpen(false)}>Demo</MobileNavLink>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--gold)",
                textDecoration: "none",
                padding: "10px 0",
                borderTop: "1px solid var(--bg-border)",
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                textDecoration: "none",
                padding: "10px 0",
                borderTop: "1px solid var(--bg-border)",
              }}
            >
              Sign In
            </Link>
          )}
          <a
            href="https://wa.me/919925531531?text=Hello%20CardVault%20Team!%20I'm%20interested%20in%20creating%20a%20digital%20business%20card%20for%20my%20business.%20I%20would%20like%20to%20get%20more%20information%20about%20your%20premium%20features%20and%20plans.%20Thank%20you!"
            target="_blank"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--gold)",
              textDecoration: "none",
              padding: "10px 0",
            }}
          >
            Inquiry via WhatsApp
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-cta { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "Plus Jakarta Sans, sans-serif",
        fontSize: "14px",
        color: "var(--text-secondary)",
        textDecoration: "none",
        transition: "color 0.2s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        fontFamily: "Outfit, sans-serif",
        fontSize: "16px",
        fontWeight: 500,
        color: "var(--text-primary)",
        textDecoration: "none",
        padding: "8px 0",
      }}
    >
      {children}
    </Link>
  );
}
