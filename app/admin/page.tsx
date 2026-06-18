"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminLoginAction, getCurrentAdminAction, adminLogoutAction } from "@/app/card/actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      if (typeof window !== "undefined") {
        const tabSession = sessionStorage.getItem("cv_admin_session_active");
        if (tabSession !== "true") {
          await adminLogoutAction();
          return;
        }
      }
      const admin = await getCurrentAdminAction();
      if (admin) {
        router.push("/admin/dashboard");
      }
    }
    checkAdmin();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await adminLoginAction(email, password);
      if (res.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cv_admin_session_active", "true");
        }
        router.push("/admin/dashboard");
      } else {
        setError(res.error || "Authentication failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at center, #151005 0%, #080808 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Outfit, sans-serif"
    }}>
      {/* Brand Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", marginBottom: "32px" }}>
        <span style={{ fontWeight: 700, fontSize: "26px", color: "var(--text-primary)" }}>Card</span>
        <span style={{ fontWeight: 700, fontSize: "26px", color: "var(--gold)" }}>Vault</span>
        <span style={{ fontSize: "11px", color: "#F0C96B", border: "1px solid rgba(240,201,107,0.3)", borderRadius: "4px", padding: "1px 6px", marginLeft: "8px", textTransform: "uppercase", fontWeight: 600 }}>Admin</span>
      </Link>

      <div style={{
        maxWidth: "400px",
        width: "100%",
        background: "rgba(20, 20, 20, 0.75)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(212, 168, 67, 0.2)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 32px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", textAlign: "center" }}>
          Admin LoginPortal
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "28px", textAlign: "center" }}>
          Secure system configuration access
        </p>

        {error && (
          <div style={{
            background: "rgba(244,63,94,0.12)",
            border: "1px solid rgba(244,63,94,0.25)",
            color: "var(--error)",
            borderRadius: "var(--radius-md)",
            padding: "12px",
            fontSize: "13px",
            marginBottom: "20px"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="input-label" style={{ color: "rgba(255,255,255,0.8)" }}>Admin Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="admin@cardvault.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ background: "rgba(8,8,8,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="input-label" style={{ color: "rgba(255,255,255,0.8)" }}>Secret Key Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ background: "rgba(8,8,8,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "12px", textDecoration: "none" }}
          >
            {loading ? "Verifying Keys..." : "Verify & Authorize"}
          </button>
        </form>
      </div>

      <Link href="/" style={{ color: "var(--text-muted)", fontSize: "13px", textDecoration: "none", marginTop: "24px" }}>
        ← Return to Main Page
      </Link>
    </div>
  );
}
