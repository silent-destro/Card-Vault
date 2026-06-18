import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Blog | CardVault - Business Growth & Digital Networking",
  description: "Discover professional insights, networking tips, and business growth guides from the CardVault team to help your offline business stand out online.",
};

const POSTS = [
  {
    id: "boost-google-reviews-ai",
    title: "How to Boost Your Google Maps Reviews by 150% with AI",
    date: "June 10, 2026",
    category: "Marketing & SEO",
    summary: "Discover how giving your customers AI-generated review suggestions in English, Hindi, and Gujarati can break review friction and boost your store's Google Maps search ranking.",
    readTime: "5 min read",
    author: "Marketing Team"
  },
  {
    id: "traditional-vs-digital-business-cards",
    title: "Traditional vs. Digital Business Cards: Why It's Time to Switch in 2026",
    date: "May 28, 2026",
    category: "Networking",
    summary: "We compare the environmental impact, costs, convenience, and interactive features of paper vs. online business cards. Learn why paper is becoming obsolete in retail.",
    readTime: "4 min read",
    author: "Product Team"
  },
  {
    id: "zero-fee-upi-integration-retail",
    title: "Simplifying Payments: How Retail Merchants Use UPI on Digital Cards",
    date: "May 15, 2026",
    category: "Productivity & Tech",
    summary: "Direct bank transfer buttons on your bio card help you collect fast checkout orders via GPay, PhonePe, and Paytm without transaction cuts. Here is how to configure it.",
    readTime: "6 min read",
    author: "Engineering Team"
  }
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main style={{ padding: "120px 0 80px", background: "var(--bg-base)", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
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
                📰 CardVault Insights
              </span>
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Our Latest <em className="gold">Articles</em>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Tips, guides, and insights to help you grow your business and build a powerful online presence.
            </p>
          </div>

          {/* Blog posts grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {POSTS.map(post => (
              <article
                key={post.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "32px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{
                    fontSize: "11px",
                    color: "var(--gold)",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 600,
                  }}>
                    {post.category}
                  </span>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h2 style={{
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  fontSize: "22px",
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                  lineHeight: 1.4,
                }}>
                  {post.title}
                </h2>

                <p style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  marginBottom: "20px"
                }}>
                  {post.summary}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    By {post.author}
                  </span>
                  <a
                    href="https://wa.me/919925531531?text=Hello%20CardVault!%20I%20read%20your%20blog%20post%20about%20boosting%20reviews%20and%20want%20to%20know%20more."
                    target="_blank"
                    style={{
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--gold)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    Read Full Article via WhatsApp Support →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
