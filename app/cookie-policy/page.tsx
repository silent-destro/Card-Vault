import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Cookie Policy | CardVault",
  description: "Read our Cookie Policy to understand how we use essential session cookies, analytical cookies, and OAuth credentials to secure and optimize your dashboard.",
};

export default function CookiePolicyPage() {
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
                🍪 Transparent Cookie Usage
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Cookie <em className="gold">Policy</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Last updated: June 12, 2026. Learn how we use cookies to power your secure dashboard.
            </p>
          </div>

          {/* Cookie Policy content */}
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
              This Cookie Policy explains how CardVault uses cookies and similar technologies to recognize you when you visit our website at cardvault.in. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              1. What Are Cookies?
            </h2>
            <p style={{ marginBottom: "20px" }}>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              2. Cookies We Use
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We use the following types of cookies on CardVault:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li><strong>Essential Session Cookies:</strong> These cookies are strictly necessary to provide you with services available through our Website (such as securing user authentication, NextAuth logins, and managing dashboard permissions). Without these, our dashboard and card builder cannot operate.</li>
              <li><strong>Performance and Analytics Cookies:</strong> These cookies collect information that is used in aggregate form to help us understand how our website is being used (e.g. tracking card views and catalog clicks) or how effective our landing page campaigns are.</li>
              <li><strong>Preference Cookies:</strong> These cookies remember your preferences, such as selected card themes or language settings (English, Hindi, Gujarati), to improve your editing and viewing experience.</li>
            </ul>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              3. Managing Cookies
            </h2>
            <p style={{ marginBottom: "20px" }}>
              You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our public landing page and public business cards, but your access to some functionality and secure dashboard areas will be strictly restricted.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              4. Updates to this Policy
            </h2>
            <p style={{ marginBottom: "20px" }}>
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              5. Support
            </h2>
            <p>
              If you have any questions about our use of cookies or other technologies, please reach out to our support team directly via WhatsApp at <strong>+91 99255 31531</strong>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
