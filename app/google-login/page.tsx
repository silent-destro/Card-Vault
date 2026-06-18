"use client";
import { useEffect } from "react";
import { signIn } from "next-auth/react";

// This page is now a redirect shim — it immediately triggers real Google OAuth via NextAuth.
// The old fake account-picker UI has been replaced with the real Google sign-in flow.
export default function GoogleLoginPage() {
  useEffect(() => {
    // Automatically trigger the real Google OAuth flow
    signIn("google", { callbackUrl: "/api/auth/set-session" });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      fontFamily: "Roboto, Arial, sans-serif",
      color: "#202124",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        border: "1px solid #DADCE0",
        borderRadius: "8px",
        padding: "40px 36px",
        textAlign: "center"
      }}>
        {/* Google logo */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginBottom: "24px" }}>
          <span style={{ fontWeight: 600, fontSize: "24px", color: "#4285F4" }}>G</span>
          <span style={{ fontWeight: 600, fontSize: "24px", color: "#EA4335" }}>o</span>
          <span style={{ fontWeight: 600, fontSize: "24px", color: "#FBBC05" }}>o</span>
          <span style={{ fontWeight: 600, fontSize: "24px", color: "#4285F4" }}>g</span>
          <span style={{ fontWeight: 600, fontSize: "24px", color: "#34A853" }}>l</span>
          <span style={{ fontWeight: 600, fontSize: "24px", color: "#EA4335" }}>e</span>
        </div>

        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #1a73e8",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }} />

        <h1 style={{ fontSize: "20px", fontWeight: 400, margin: "0 0 8px 0", color: "#202124" }}>
          Redirecting to Google...
        </h1>
        <p style={{ fontSize: "14px", color: "#5f6368", margin: 0 }}>
          You will be redirected to Google&apos;s secure sign-in page.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
