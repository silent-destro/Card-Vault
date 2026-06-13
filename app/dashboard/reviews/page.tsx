"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardReviews, getCurrentUserAction } from "@/app/card/actions";

interface ReviewItem {
  date: string;
  stars: number;
  platform: string;
  language: string;
  tags: string[];
  text: string;
  businessName: string;
}

interface StatItem {
  label: string;
  value: string;
  icon: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("free");
  const [thisMonthCount, setThisMonthCount] = useState(0);

  useEffect(() => {
    async function loadReviews() {
      try {
        const [data, user] = await Promise.all([
          getDashboardReviews(),
          getCurrentUserAction()
        ]);
        if (data) {
          setReviews(data.reviews);
          setStats(data.stats);
          // Calculate this month's reviews for free plan cap display
          const now = new Date();
          const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          // Note: data.reviews dates are formatted strings; count stat is more reliable
          const thisMonthStat = data.stats.find(s => s.label === "This Month");
          const monthCount = thisMonthStat ? parseInt(thisMonthStat.value.replace("+", "")) : 0;
          setThisMonthCount(monthCount);
        }
        if (user) {
          setUserPlan(user.plan);
        }
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Dashboard</Link>
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "8px", marginBottom: "4px" }}>Review History</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>All reviews collected via your CardVault cards</p>
      </div>

      {/* Free plan monthly cap banner */}
      {userPlan === "free" && (
        <div style={{
          padding: "14px 20px",
          background: thisMonthCount >= 10 ? "rgba(244,63,94,0.08)" : thisMonthCount >= 7 ? "rgba(245,158,11,0.08)" : "var(--gold-glow)",
          border: `1px solid ${thisMonthCount >= 10 ? "rgba(244,63,94,0.25)" : thisMonthCount >= 7 ? "rgba(245,158,11,0.25)" : "rgba(212,168,67,0.25)"}`,
          borderRadius: "var(--radius-md)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: thisMonthCount >= 10 ? "var(--error)" : "var(--text-primary)", marginBottom: "2px" }}>
              {thisMonthCount >= 10 ? "🔒 Monthly Review Limit Reached" : `⭐ Free Plan: ${thisMonthCount} / 10 AI Reviews This Month`}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {thisMonthCount >= 10
                ? "Your Free plan allows 10 AI reviews per month. Upgrade to Pro for unlimited reviews."
                : `You have ${10 - thisMonthCount} reviews remaining this month. Upgrade to Pro for unlimited reviews.`}
            </div>
          </div>
          <Link href="/dashboard/billing" className="btn-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: "12px", whiteSpace: "nowrap" }}>
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="reviews-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "22px", color: "var(--gold)", marginBottom: "4px" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>All Reviews</h3>
          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>📥 Export CSV</button>
        </div>
        
        {reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⭐</div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No reviews collected yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bg-border)" }}>
                  {["Date", "Business", "Rating", "Platform", "Language", "Tags", "Review"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", color: "var(--text-muted)", fontFamily: "Outfit, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--bg-border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{r.date}</td>
                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{r.businessName}</td>
                    <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ color: s <= r.stars ? "#F0C96B" : "var(--bg-border)", fontSize: "13px" }}>★</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: r.platform === "Google" ? "rgba(66,133,244,0.12)" : r.platform === "Facebook" ? "rgba(59,89,152,0.12)" : "var(--bg-elevated)",
                        color: r.platform === "Google" ? "#4285F4" : r.platform === "Facebook" ? "#3B5998" : "var(--text-muted)",
                        border: "1px solid r.platform === 'Google' || r.platform === 'Facebook' ? 'currentColor' : 'var(--bg-border)'",
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: 600,
                      }}>
                        {r.platform}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>{r.language}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {r.tags.map(tag => (
                          <span key={tag} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "999px", background: "var(--gold-glow)", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.25)", whiteSpace: "nowrap" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: "12px", color: "var(--text-secondary)", maxWidth: "240px" }}>
                      <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }} title={r.text}>{r.text}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .reviews-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

