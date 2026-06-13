import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MOCK_CARDS } from "@/lib/cardData";
import Link from "next/link";

export default function DemoPage() {
  const card = MOCK_CARDS["demo"];

  return (
    <>
      <Navbar />
      <main style={{ padding: "60px 0", background: "var(--bg-base)" }}>
        <div className="container" style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--gold-glow)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: "var(--radius-full)",
            padding: "6px 16px",
            marginBottom: "20px",
          }}>
            <span style={{ fontSize: "11px", color: "var(--gold)", fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              📲 Live Interactive Demo
            </span>
          </div>
          <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            See CardVault <em className="gold">In Action</em>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "480px", margin: "0 auto 32px" }}>
            This is a real, working digital business card. Try all the features — no login needed.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/card/demo" className="btn-primary">View Full Card →</Link>
            <Link href="/card/demo/review" className="btn-secondary">Try AI Review</Link>
            <Link href="/sign-up" className="btn-secondary">Create My Card</Link>
          </div>
        </div>

        {/* Embedded card preview */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: "420px", padding: "0 16px" }}>
            <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", fontFamily: "Outfit, sans-serif", fontWeight: 500 }}>
              👆 This is how your card will look on mobile
            </p>
            <iframe
              src="/card/demo"
              style={{
                width: "100%",
                height: "800px",
                border: "none",
                borderRadius: "24px",
                boxShadow: "0 0 60px rgba(212,168,67,0.15), 0 40px 80px rgba(0,0,0,0.6)",
              }}
              title="CardVault Demo Card"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
