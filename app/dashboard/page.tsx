"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardHomeData, getCurrentUserAction } from "@/app/card/actions";

interface StatItem {
  label: string;
  value: string;
  trend: string;
  icon: string;
  color: string;
}

interface ActivityItem {
  text: string;
  time: string;
  icon: string;
}

interface CardItem {
  id: string;
  slug: string;
  businessName: string;
  theme: string;
  isActive: boolean;
  logoUrl: string;
  views: number;
  reviewsCount: number;
  isLocked?: boolean;
}

export default function DashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; plan: string; cardsCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<number>(0);
  const [missingFields, setMissingFields] = useState<Array<{ key: string; label: string; step: number }>>([]);
  const [mainCardSlug, setMainCardSlug] = useState<string>("");
  const [cardUrlPrefix, setCardUrlPrefix] = useState("cardvault.in/card/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCardUrlPrefix(`${window.location.host}/card/`);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDashboardHomeData();
        if (data) {
          setStats(data.stats);
          setActivities(data.activities);
          setCards(data.cards);
          setProfileComplete(data.profileComplete || 0);
          setMissingFields(data.missingFields || []);
          setMainCardSlug(data.mainCardSlug || "");
        }
        const u = await getCurrentUserAction();
        if (u) {
          setUser(u);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "6px" }}>
          Welcome back, {user?.name || "User"}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Here&apos;s what&apos;s happening with your business card today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ transition: "transform 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>{stat.icon}</span>
              <span style={{
                fontSize: "11px",
                color: stat.color,
                background: `${stat.color}15`,
                border: `1px solid ${stat.color}30`,
                borderRadius: "var(--radius-full)",
                padding: "3px 8px",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}>
                {stat.trend}
              </span>
            </div>
            <div className="text-h2" style={{ color: "var(--text-primary)", marginBottom: "4px" }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-layout-grid">
        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
            Quick Actions
          </h2>
          <div className="quick-actions-grid">
            {[
              { icon: "➕", label: "Create New Card", href: "/dashboard/create", primary: true },
              { icon: "📊", label: "View Analytics", href: "/dashboard/analytics" },
              { icon: "🃏", label: "Manage Cards", href: "/dashboard/cards" },
              { icon: "⭐", label: "Review History", href: "/dashboard/reviews" },
              { icon: "🛍", label: "Edit Catalog", href: `/dashboard/catalog/${cards[0]?.slug || "demo"}` },
              { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                onClick={(e) => {
                  if (action.href === "/dashboard/create") {
                    try {
                      sessionStorage.removeItem("cardvault_create_draft");
                      sessionStorage.removeItem("cardvault_create_step");
                    } catch (err) {}
                    const limits: Record<string, number> = {
                      free: 1,
                      pro: 2,
                      business: 4
                    };
                    const limit = limits[user?.plan || "free"] || 1;
                    if (user && user.cardsCount >= limit) {
                      e.preventDefault();
                      alert(`Plan limit reached! Your current ${user.plan.toUpperCase()} plan is limited to ${limit} business card(s). Please upgrade to create more!`);
                      router.push("/dashboard/billing");
                    }
                  }
                  if (action.href.startsWith("/dashboard/catalog") && user?.plan === "free") {
                    e.preventDefault();
                    alert("Product Catalog is a Pro/Business feature. Please upgrade your plan to manage your product catalog!");
                    router.push("/dashboard/billing");
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 12px",
                  background: action.primary ? "var(--gold-glow)" : "var(--bg-elevated)",
                  border: action.primary ? "1px solid rgba(212,168,67,0.3)" : "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)";
                  (e.currentTarget as HTMLElement).style.background = "var(--gold-glow)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = action.primary ? "rgba(212,168,67,0.3)" : "var(--bg-border)";
                  (e.currentTarget as HTMLElement).style.background = action.primary ? "var(--gold-glow)" : "var(--bg-elevated)";
                }}
              >
                <span style={{ fontSize: "22px" }}>{action.icon}</span>
                <span style={{ fontSize: "12px", fontFamily: "Outfit, sans-serif", fontWeight: 600, color: action.primary ? "var(--gold)" : "var(--text-secondary)", textAlign: "center" }}>
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Profile Completeness Checklist (Fix 10) */}
          {cards.length > 0 && profileComplete < 100 && (
            <div className="card" style={{ border: "1px solid rgba(212, 168, 67, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>
                  Complete Your Profile
                </h2>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--gold)" }}>{profileComplete}%</span>
              </div>
              <div style={{ height: "6px", background: "var(--bg-border)", borderRadius: "3px", marginBottom: "16px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${profileComplete}%`, background: "var(--gold)", borderRadius: "3px", transition: "width 0.5s ease-out" }} />
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.5 }}>
                Complete these details to optimize your card:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                {missingFields.map(field => (
                  <Link key={field.key} href={`/dashboard/edit/${mainCardSlug}?step=${field.step}`} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.background = "var(--gold-glow)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--bg-border)";
                    e.currentTarget.style.background = "var(--bg-elevated)";
                  }}
                  >
                    <span style={{ fontSize: "10px" }}>➕</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>Add {field.label}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-card)", padding: "2px 6px", borderRadius: "4px" }}>Step {field.step}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="card">
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
              Recent Activity
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {activities.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom: i < activities.length - 1 ? "1px solid var(--bg-border)" : "none",
                }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "2px" }}>{item.text}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Your Cards */}
      <div style={{ marginTop: "24px" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>
              Your Cards
            </h2>
            <Link href="/dashboard/cards" style={{ fontSize: "13px", color: "var(--gold)", textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {/* Cards List rendering */}
          {cards.map((c) => (
            <div key={c.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px",
              background: "var(--bg-elevated)",
              border: c.isLocked ? "1px solid rgba(244,63,94,0.3)" : "1px solid var(--bg-border)",
              borderRadius: "var(--radius-md)",
              marginBottom: "12px",
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                background: "linear-gradient(145deg, #0A0A0A, #1A1200)",
                border: c.isLocked ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(212,168,67,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
                overflow: "hidden",
              }}>
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  c.businessName.charAt(0)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "3px" }}>
                  {c.businessName}
                </div>
                {c.isLocked ? (
                  <div style={{ fontSize: "11px", color: "var(--error)", marginBottom: "4px" }}>
                    This card is locked because it exceeds your plan&apos;s card limit.
                  </div>
                ) : c.isActive ? (
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "var(--gold)", marginBottom: "4px" }}>
                    {cardUrlPrefix}{c.slug}
                  </div>
                ) : (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ background: "rgba(212,168,67,0.1)", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: "3px", padding: "1px 5px", fontWeight: 600, fontSize: "10px" }}>DRAFT</span>
                    <span>Complete to publish</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>👁 {c.views.toLocaleString()} views</span>
                  <span>⭐ {c.reviewsCount} reviews</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {c.isLocked ? (
                  <>
                    <span style={{
                      background: "rgba(244,63,94,0.12)",
                      color: "var(--error)",
                      border: "1px solid rgba(244,63,94,0.25)",
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600
                    }}>
                      Locked 🔒
                    </span>
                    <Link href="/dashboard/billing" className="btn-primary" style={{ padding: "6px 14px", fontSize: "12px", background: "var(--error)", borderColor: "var(--error)" }}>
                      Upgrade
                    </Link>
                  </>
                ) : (
                  <>
                    <span style={{
                      background: c.isActive ? "rgba(34,197,94,0.12)" : "rgba(212,168,67,0.12)",
                      color: c.isActive ? "#22C55E" : "var(--gold)",
                      border: `1px solid ${c.isActive ? "rgba(34,197,94,0.25)" : "rgba(212,168,67,0.25)"}`,
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600
                    }}>
                      {c.isActive ? "Active" : "Draft"}
                    </span>
                    <Link href={`/dashboard/edit/${c.slug}`} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                      Edit
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Empty state for more cards */}
          <Link
            href="/dashboard/create"
            onClick={(e) => {
              const limits: Record<string, number> = {
                free: 1,
                pro: 2,
                business: 4
              };
              const limit = limits[user?.plan || "free"] || 1;
              if (user && user.cardsCount >= limit) {
                e.preventDefault();
                alert(`Plan limit reached! Your current ${user.plan.toUpperCase()} plan is limited to ${limit} business card(s). Please upgrade to create more!`);
                router.push("/dashboard/billing");
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              border: "2px dashed var(--bg-border)",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              marginTop: "12px",
              transition: "all 0.2s",
              color: "var(--text-muted)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)";
              (e.currentTarget as HTMLElement).style.color = "var(--gold)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--bg-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <span style={{ fontSize: "24px" }}>➕</span>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 500, fontSize: "14px" }}>
              Create a new card
            </span>
          </Link>
          <style>{`
        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .dashboard-layout-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-layout-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}
