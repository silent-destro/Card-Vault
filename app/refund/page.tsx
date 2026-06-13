import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Refund Policy | CardVault",
  description: "Review CardVault's Refund Policy. Learn about our strict all-sales-final policy on all plans and trials.",
};

export default function RefundPage() {
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
                🔒 Strict Refund Policy
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Refund <em className="gold">Policy</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Last updated: June 12, 2026. Please review our strict no-refund terms before purchasing.
            </p>
          </div>

          {/* Refund content */}
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
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginBottom: "12px" }}>
              1. All Sales Are Final
            </h2>
            <p style={{ marginBottom: "20px" }}>
              At CardVault, all transactions are strictly final. Once a transaction is processed, we do not offer refunds, exchanges, or credits of any kind under any circumstances.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              2. ₹30 Free Trial Plan
            </h2>
            <p style={{ marginBottom: "20px" }}>
              The ₹30 payment for the 2-day trial is non-refundable. This fee covers payment processing, secure server provisioning, and basic account setup.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              3. Subscription Upgrades & Extensions
            </h2>
            <p style={{ marginBottom: "20px" }}>
              All purchases of Pro and Business subscription plans (whether billed monthly or annually) and validity extensions are completely non-refundable. We do not provide prorated refunds or credits for early cancellations or unused days.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>
              4. Service Inquiries
            </h2>
            <p>
              If you have any payment issues or double-billing concerns, please reach out to our support team directly via WhatsApp at <strong>+91 99255 31531</strong>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
