"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardCards, deleteCardAction, getCurrentUserAction } from "@/app/card/actions";

interface DashboardCardItem {
  id: string;
  slug: string;
  businessName: string;
  theme: string;
  isActive: boolean;
  views: number;
  reviewsCount: number;
  calls: number;
  whatsapps: number;
  pays: number;
  catalogs: number;
  showCatalog: boolean;
  googleReviewUrl: string;
  logoUrl: string;
  isLocked?: boolean;
}

export default function CardsPage() {
  const [cards, setCards] = useState<DashboardCardItem[]>([]);
  const [user, setUser] = useState<{ plan: string; cardsCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardUrlPrefix, setCardUrlPrefix] = useState("cardvault.in/card/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCardUrlPrefix(`${window.location.host}/card/`);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCards() {
      try {
        const data = await getDashboardCards();
        if (active) {
          setCards(data);
        }
        const u = await getCurrentUserAction();
        if (u && active) {
          setUser(u);
        }
      } catch (err) {
        console.error("Failed to load cards", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadCards();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business card? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteCardAction(id);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete card. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Dashboard</Link>
          <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "8px" }}>My Cards</h1>
        </div>
        <Link
          href="/dashboard/create"
          onClick={(e) => {
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
              window.location.href = "/dashboard/billing";
            }
          }}
          className="btn-primary"
        >
          + Create New Card
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🃏</div>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "6px" }}>
            No Cards Created Yet
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
            Create your first interactive digital business card to get started.
          </p>
          <Link href="/dashboard/create" className="btn-primary" style={{ display: "inline-flex" }}>
            Create My Card
          </Link>
        </div>
      ) : (
        cards.map(card => {
          return (
            <div key={card.id} className="card" style={{ marginBottom: "16px", border: card.isLocked ? "1px solid rgba(244,63,94,0.3)" : undefined }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                {/* Preview */}
                <div style={{
                  width: "80px",
                  height: "100px",
                  borderRadius: "14px",
                  background: "linear-gradient(145deg, #0A0A0A, #1A1200)",
                  border: card.isLocked ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(212,168,67,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  gap: "4px",
                  overflow: "hidden",
                }}>
                  {card.logoUrl ? (
                    <img src={card.logoUrl} alt={card.businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <span style={{ fontSize: "28px" }}>🏪</span>
                      <span style={{ fontSize: "8px", color: "#D4A843", fontFamily: "Outfit, sans-serif", textTransform: "capitalize" }}>
                        {card.theme.replace("-", " ")}
                      </span>
                    </>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)" }}>
                      {card.businessName}
                    </h3>
                     <span style={{
                       background: card.isLocked ? "rgba(244,63,94,0.12)" : card.isActive ? "rgba(34,197,94,0.12)" : "rgba(212,168,67,0.12)",
                       color: card.isLocked ? "var(--error)" : card.isActive ? "#22C55E" : "var(--gold)",
                       border: `1px solid ${card.isLocked ? "rgba(244,63,94,0.25)" : card.isActive ? "rgba(34,197,94,0.25)" : "rgba(212,168,67,0.25)"}`,
                       fontSize: "11px",
                       padding: "3px 8px",
                       borderRadius: "999px",
                       fontFamily: "Outfit, sans-serif",
                       fontWeight: 600
                     }}>
                       {card.isLocked ? "Locked 🔒" : card.isActive ? "Active" : "Draft"}
                     </span>
                  </div>
                  {/* Card URL — only show when published and not locked */}
                  {card.isLocked ? (
                    <div style={{ fontSize: "12px", color: "var(--error)", marginBottom: "10px" }}>
                      This card is locked because it exceeds your plan&apos;s card limit.
                    </div>
                  ) : card.isActive ? (
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "var(--gold)", marginBottom: "10px" }}>
                      {cardUrlPrefix}{card.slug}
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "10px", background: "rgba(212,168,67,0.12)", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: "4px", padding: "2px 6px", fontWeight: 600 }}>DRAFT</span>
                      <span>Complete your card to publish it</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    {[
                      { icon: "👁", label: `${card.views.toLocaleString()} Views` },
                      { icon: "⭐", label: `${card.reviewsCount} Reviews` },
                      { icon: "📞", label: `${card.calls} Calls` },
                      { icon: "💬", label: `${card.whatsapps} WhatsApps` },
                    ].map(m => (
                      <div key={m.label} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px" }}>{m.icon}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {card.isLocked ? (
                    <Link href="/dashboard/billing" className="btn-primary" style={{ fontSize: "13px", padding: "10px 18px", justifyContent: "center", background: "var(--error)", borderColor: "var(--error)" }}>
                      Upgrade to Unlock 🔒
                    </Link>
                  ) : (
                    <>
                      {/* View Card — only for active cards */}
                      {card.isActive ? (
                        <Link href={`/card/${card.slug}`} target="_blank" className="btn-primary" style={{ fontSize: "13px", padding: "10px 18px", justifyContent: "center" }}>
                          View Card →
                        </Link>
                      ) : (
                        <Link href={`/dashboard/edit/${card.slug}`} className="btn-primary" style={{ fontSize: "13px", padding: "10px 18px", justifyContent: "center", background: "rgba(212,168,67,0.15)", borderColor: "rgba(212,168,67,0.4)" }}>
                          ✍️ Complete Card
                        </Link>
                      )}

                      {/* Try AI Review — only when google review URL is set AND card is active */}
                      {card.isActive && card.googleReviewUrl && (
                        <Link href={`/card/${card.slug}/review`} target="_blank" className="btn-secondary" style={{ fontSize: "13px", padding: "10px 18px", justifyContent: "center" }}>
                          ⭐ Try AI Review
                        </Link>
                      )}

                      {/* Manage Catalog — only when showCatalog is enabled */}
                      {card.showCatalog && (
                        <Link
                          href={user?.plan === "free" ? "/dashboard/billing" : `/dashboard/catalog/${card.slug}`}
                          className="btn-secondary"
                          style={{ fontSize: "13px", padding: "10px 18px", justifyContent: "center", color: "var(--gold)", borderColor: "rgba(212,168,67,0.3)" }}
                        >
                          🛍 Manage Catalog
                        </Link>
                      )}

                      <Link href={`/dashboard/edit/${card.slug}`} className="btn-secondary" style={{ fontSize: "13px", padding: "10px 18px", justifyContent: "center" }}>
                        ✏️ Edit Card
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom row */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--bg-border)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {!card.isLocked ? (
                  <>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/card/${card.slug}`);
                      alert("Link copied to clipboard!");
                    }} className="btn-secondary" style={{ fontSize: "12px", padding: "8px 14px" }}>
                      📋 Copy Link
                    </button>
                    <a href={`/card/${card.slug}`} target="_blank" className="btn-secondary" style={{ fontSize: "12px", padding: "8px 14px", textDecoration: "none" }}>
                      📲 View QR
                    </a>
                    <button onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: card.businessName,
                          text: `Check out my digital business card:`,
                          url: `${window.location.origin}/card/${card.slug}`
                        }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(`${window.location.origin}/card/${card.slug}`);
                        alert("Link copied! Share it with your clients.");
                      }
                    }} className="btn-secondary" style={{ fontSize: "12px", padding: "8px 14px" }}>
                      📤 Share
                    </button>
                  </>
                ) : null}
                <button onClick={() => handleDelete(card.id)} className="btn-secondary" style={{ fontSize: "12px", padding: "8px 14px", marginLeft: "auto", color: "var(--error)", borderColor: "rgba(244,63,94,0.3)" }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          )
        })
      )}

      {/* Create more prompt */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName === "A" || (e.target as HTMLElement).closest("a")) {
            return;
          }
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
            alert(`Plan limit reached! Your current ${user.plan.toUpperCase()} plan is limited to ${limit} business card(s). Please upgrade to create more!`);
            window.location.href = "/dashboard/billing";
          } else {
            window.location.href = "/dashboard/create";
          }
        }}
        style={{
          border: "2px dashed var(--bg-border)",
          borderRadius: "var(--radius-xl)",
          padding: "48px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginTop: "24px"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--gold)";
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "var(--shadow-float)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--bg-border)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>➕</div>
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "6px" }}>
          Create Another Card
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>
          {user?.plan === "free" ? (
            <>Free plan: 1 card. <Link href="/dashboard/billing" style={{ color: "var(--gold)", textDecoration: "none" }}>Upgrade to Pro</Link> for 2 cards.</>
          ) : user?.plan === "pro" ? (
            <>Pro plan: 2 cards. <Link href="/dashboard/billing" style={{ color: "var(--gold)", textDecoration: "none" }}>Upgrade to Business</Link> for 4 cards.</>
          ) : (
            <>Business plan: 4 cards.</>
          )}
        </p>
        {(!user || user.plan !== "business") && (
          <Link href="/dashboard/billing" className="btn-primary" style={{ display: "inline-flex" }}>
            Upgrade Plan →
          </Link>
        )}
      </div>
    </div>
  );
}
