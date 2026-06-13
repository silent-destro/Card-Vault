"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { signInAction, getCurrentUserAction, signOutAction } from "@/app/card/actions";
import { forceRedirect, forceLogout } from "@/lib/auth-utils";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const err = searchParams.get("error");
      if (err === "AccessDenied" || err === "expired") {
        setError("Your account validity has expired. Please contact the administrator to renew or upgrade your plan.");
      }
    }

    async function checkSession() {
      try {
        if (typeof window !== "undefined") {
          const tabSession = sessionStorage.getItem("cv_session_active");
          if (tabSession === "true") {
            const u = await getCurrentUserAction();
            if (u && !u.planExpired) {
              forceRedirect("/dashboard");
            }
          }
        }
      } catch (e) {}
    }
    checkSession();
  }, [router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email");
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email address");
    
    setLoading(true);
    setError("");
    try {
      const res = await signInAction(email, password);
      if (res.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cv_session_active", "true");
          const redirectPath = localStorage.getItem("cv_redirect_after_login");
          if (redirectPath) {
            localStorage.removeItem("cv_redirect_after_login");
            forceRedirect(redirectPath);
            return;
          }
        }
        forceRedirect("/dashboard");
      } else {
        setError(res.error || "Failed to sign in");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex" }}>
      {/* Left: Form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", marginBottom: "48px" }}>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "28px", color: "var(--text-primary)" }}>Card</span>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "28px", color: "var(--gold)" }}>Vault</span>
        </Link>

        <div style={{ width: "100%", maxWidth: "380px" }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "28px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>
            Sign in to manage your digital cards
          </p>

          {error && (
            <div style={{
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.25)",
              color: "var(--error)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              fontSize: "13px",
              marginBottom: "20px",
              fontFamily: "Outfit, sans-serif"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label className="input-label">Email Address</label>
              <input className="input-field" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" onClick={e => { e.preventDefault(); alert("Password reset is coming soon. Please contact support at support@cardvault.in"); }} style={{ fontSize: "12px", color: "var(--gold)", textDecoration: "none" }}>Forgot password?</a>
              </div>
              <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="signin-visual" style={{
        flex: 1,
        background: "linear-gradient(145deg, #1A1200, #0A0A0A)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        borderLeft: "1px solid var(--bg-border)",
      }}>
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div style={{ fontSize: "80px", marginBottom: "24px" }}>🃏</div>
          <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Your Business,<br />
            <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Elevated</em>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7 }}>
            Join 5,000+ Indian businesses who share their digital card via WhatsApp and collect reviews automatically.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "28px" }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#F0C96B", fontSize: "20px" }}>★</span>)}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>50,000+ Reviews Collected</p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .signin-visual { display: none !important; }
        }
      `}</style>
    </div>
  );
}
