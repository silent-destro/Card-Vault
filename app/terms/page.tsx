import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | CardVault",
  description: "Read the Terms of Service for using CardVault. Understand billing cycles, plan limits, custom domain configuration, and user responsibilities.",
};

export default function TermsPage() {
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
                📋 Service Agreement
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Terms of <em className="gold">Service</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Last updated: June 12, 2026. Please read these terms carefully before creating a card.
            </p>
          </div>

          {/* Terms content */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            lineHeight: 1.8,
            color: "var(--text-secondary)",
            fontSize: "14px",
          }}>
            <p style={{ marginBottom: "20px" }}>
              Welcome to CardVault! These Terms of Service govern your use of the website located at cardvault.in and the digital business card creation services provided by our platform.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              1. Registration and Account Limits
            </h2>
            <p style={{ marginBottom: "16px" }}>
              By registering an account with us, you agree to supply accurate registration information. Account features and digital card creations are subject to plan limits:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Free Trial:</strong> Limit of 1 digital card, basic themes only, locked catalog and booking features.</li>
              <li><strong>Pro Plan:</strong> Limit of 2 digital cards, all premium themes, up to 20 product catalog items, and booking.</li>
              <li><strong>Business Plan:</strong> Limit of 4 digital cards, all premium themes, unlimited catalog items, and booking.</li>
            </ul>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              2. Subscription Expiry and Lockouts
            </h2>
            <p style={{ marginBottom: "16px" }}>
              Subscriptions must be renewed on or before the expiration date. If your plan expires:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Your account login credentials and Google OAuth sign-ins will be blocked.</li>
              <li>An expiration notice will be displayed until the plan is upgraded or extended by the administrator.</li>
              <li>Cards created exceeding the plan tier limits (e.g. during a plan downgrade) will be locked from public view.</li>
            </ul>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              3. Content Guidelines
            </h2>
            <p style={{ marginBottom: "16px" }}>
              You retain ownership of the contents you publish on your card. However, you are solely responsible for ensuring that your digital cards do not host illegal material, trademark violations, misleading business catalogs, or spam links. CardVault reserves the right to lock or delete accounts that violate these guidelines.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              4. Custom Domains and Hosting
            </h2>
            <p style={{ marginBottom: "16px" }}>
              For premium plans, custom domain mapping requires configuring DNS CNAME settings pointing to our hosting infrastructure. We strive for 99.9% uptime, but we are not responsible for domain registrar outages or DNS resolution delays.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              5. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, under the jurisdiction of the courts of <strong>Rajkot, Gujarat</strong>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
