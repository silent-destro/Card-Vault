"use client";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Outfit, sans-serif"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--bg-border)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 32px",
        textAlign: "center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔒</div>
        <h1 className="text-display-sm" style={{ color: "var(--text-primary)", marginBottom: "16px", fontWeight: 700 }}>
          Public Registration <span style={{ color: "var(--gold)" }}>Disabled</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
          CardVault is a premium paid-only platform. Public sign-ups are currently closed. If you have purchased a plan, our team will manually create your account and email you your login credentials.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/sign-in" className="btn-primary" style={{ display: "flex", justifyContent: "center", textDecoration: "none" }}>
            Go to Sign In
          </Link>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: "13px", textDecoration: "none", marginTop: "12px" }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
