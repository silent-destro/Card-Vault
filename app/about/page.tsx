import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About Us | CardVault - Smart Digital Business Cards",
  description: "Learn about CardVault's mission to digitize traditional business networking in India using NFC-ready online digital business cards and automated AI review growth tools.",
};

export default function AboutPage() {
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
                🤝 Our Story
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Empowering India&apos;s <em className="gold">Digital Identity</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              We design premium digital alternatives to paper business cards that connect merchants, professionals, and customers.
            </p>
          </div>

          {/* Content Card */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            lineHeight: 1.8,
            color: "var(--text-secondary)",
            fontSize: "15px",
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "22px", marginBottom: "16px" }}>
              Who We Are
            </h2>
            <p style={{ marginBottom: "24px" }}>
              CardVault was founded in 2026 in <strong>Rajkot, Gujarat</strong> with a simple goal: to eliminate paper waste and modernize business networking. We realized that traditional paper business cards are expensive, static, and quickly thrown away. In a mobile-first nation like India, your professional identity should reside on the screen.
            </p>
            <p style={{ marginBottom: "24px" }}>
              Today, CardVault serves thousands of small businesses, retail shops, freelancers, and enterprise sales teams across the country. We provide a single dashboard to create, manage, and track premium digital cards loaded with WhatsApp messaging, product catalogs, booking features, and direct UPI payment buttons.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "22px", marginBottom: "16px", marginTop: "40px" }}>
              Our Core Innovation: AI Google Reviews
            </h2>
            <p style={{ marginBottom: "24px" }}>
              Beyond contact sharing, CardVault is a powerful marketing tool. With our integrated **AI Review Generator**, customers can write reviews in their preferred language (English, Hindi, or Gujarati) within seconds. This allows local merchants to exponentially scale their Google Maps ratings and attract more foot traffic.
            </p>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "22px", marginBottom: "16px", marginTop: "40px" }}>
              Why Choose CardVault?
            </h2>
            <ul style={{ paddingLeft: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li><strong>Zero App Required:</strong> Your customers can view your card instantly on any mobile browser without installing anything.</li>
              <li><strong>UPI Instant Checkout:</strong> Receive payments directly into your GPay, PhonePe, or Paytm account with zero processing fees.</li>
              <li><strong>Real-time Analytics:</strong> Track views, clicks, catalog inquiries, and bookings on a single, easy-to-read dashboard.</li>
              <li><strong>Eco-Friendly & Smart:</strong> One card for a lifetime, updated instantly whenever your phone number, address, or catalog items change.</li>
            </ul>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "22px", marginBottom: "16px", marginTop: "40px" }}>
              Our Location & Contact
            </h2>
            <p>
              Our primary development office is situated in Rajkot, Gujarat. If you have any inquiries, feedback, or would like to partner with us, please reach out directly to our official customer service WhatsApp number at <strong>+91 99255 31531</strong>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
