import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Careers | CardVault Team",
  description: "Explore career opportunities at CardVault.",
};

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main style={{ padding: "120px 0 80px", background: "var(--bg-base)", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
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
                💼 Careers
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Join Our <em className="gold">Team</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Thank you for your interest in CardVault.
            </p>
          </div>

          {/* Not Hiring Card */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            textAlign: "center",
            lineHeight: 1.8,
            color: "var(--text-secondary)",
            fontSize: "15px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚫</div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "20px", marginBottom: "12px" }}>
              No Active Job Openings
            </h2>
            <p style={{ maxWidth: "540px", margin: "0 auto 16px" }}>
              CardVault is not currently hiring. We do not have any open roles or job vacancies at this time, and we are not accepting applications.
            </p>
            <p style={{ maxWidth: "540px", margin: "0 auto" }}>
              Please check back in the future for any updates on hiring opportunities.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
