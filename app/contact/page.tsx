import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Contact Us | CardVault Support",
  description: "Have questions or need support? Get in touch with the CardVault support team. We're available via WhatsApp, phone, and email.",
};

export default function ContactPage() {
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
                📞 Connect With Us
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Get in <em className="gold">Touch</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Have questions about our plans, need custom domain configuration, or want live setup support? We are here to help.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
            alignItems: "start",
          }} className="contact-grid">
            {/* Contact details */}
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-lg)",
              padding: "32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  📍 Location
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  Rajkot, Gujarat, India 🇮🇳
                </p>
              </div>

              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  ⏰ Support Timings
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  Monday - Saturday: 10:00 AM to 9:00 PM (IST)<br />
                  Sunday: Closed
                </p>
              </div>
            </div>

            {/* Direct Channels */}
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-lg)",
              padding: "32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "20px", color: "var(--text-primary)", marginBottom: "4px" }}>
                Direct Assistance
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                Skip the ticket queues! Chat directly with our onboarding specialists on WhatsApp for fast activation of your Pro or Business plan subscription.
              </p>

              <a
                href="https://wa.me/919925531531?text=Hello%20CardVault%20Onboarding%20Team!%20I'm%20setting%20up%20my%20digital%20card%20and%20need%20assistance."
                target="_blank"
                className="btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  textAlign: "center"
                }}
              >
                💬 Chat on WhatsApp (+91 99255 31531)
              </a>

              <div style={{
                marginTop: "16px",
                padding: "16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--bg-border)",
              }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  💡 Plan Activations
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, display: "block" }}>
                  To activate your chosen plan via UPI immediately, take a screenshot of your payment receipt and send it to our WhatsApp support number above.
                </span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .contact-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
