import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | CardVault",
  description: "Read CardVault's Privacy Policy. Learn how we collect, use, and protect your digital card details, business statistics, and personal information.",
};

export default function PrivacyPage() {
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
                🔒 Privacy First
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Privacy <em className="gold">Policy</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Last updated: June 12, 2026. Learn how we secure your digital identity and user credentials.
            </p>
          </div>

          {/* Policy content */}
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
              At CardVault, accessible from cardvault.in, one of our main priorities is the privacy of our visitors and registered merchants. This Privacy Policy document details the types of information we collect and record, and how we utilize it.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We collect information in the following categories:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Account Credentials:</strong> When you register on CardVault, we collect your email address, name, and securely hashed passwords or Google OAuth profiles (via NextAuth).</li>
              <li><strong>Digital Card Metadata:</strong> Information you choose to put on your public business profile, including business name, category, phone number, catalog items, photos, and links.</li>
              <li><strong>Basic Analytics:</strong> We log card page-views, click occurrences on catalog items, and booking form requests to provide you with stats.</li>
            </ul>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              2. How We Use Your Information
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We utilize the collected information to:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Maintain, operate, and secure the CardVault dashboard and public-facing URL slugs.</li>
              <li>Generate analytics reports for your digital card visits and customer engagements.</li>
              <li>Process your plan selections, subscription upgrades, and extensions.</li>
              <li>Send critical notifications, such as new customer review alerts or expiry notices.</li>
            </ul>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              3. Cookies and Session Storage
            </h2>
            <p style={{ marginBottom: "16px" }}>
              CardVault utilizes standard cookies and sessionStorage tokens to maintain secure logged-in user sessions (NextAuth credentials authentication). These cookies do not track cross-site activities and are essential to operate the dashboard. Refer to our <a href="/cookie-policy" style={{ color: "var(--gold)", textDecoration: "none" }}>Cookie Policy</a> for details.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              4. Security of Data
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We implement industry-standard database encryption, secure HTTPS transit, and NextAuth protocol layers. However, please remember that no method of transmission over the internet or database storage is 100% secure, and we cannot guarantee its absolute safety.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              5. Contact Us
            </h2>
            <p>
              If you have any questions or concerns regarding our privacy standards, please reach out to our support team directly via WhatsApp at <strong>+91 99255 31531</strong>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
