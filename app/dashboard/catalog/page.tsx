"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUserAction, getDashboardCards } from "@/app/card/actions";

interface CardItem {
  id: string;
  slug: string;
  businessName: string;
  theme: string;
  isActive: boolean;
  views: number;
  reviewsCount: number;
}

export default function CatalogIndexPage() {
  const [user, setUser] = useState<{ plan: string } | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardUrlPrefix, setCardUrlPrefix] = useState("cardvault.in/card/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCardUrlPrefix(`${window.location.host}/card/`);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await getCurrentUserAction();
        if (u) {
          setUser(u);
          if (u.plan !== "free") {
            const userCards = await getDashboardCards();
            setCards(userCards as any);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog data", err);
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
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (!user || user.plan === "free") {
    return (
      <div>
        <div style={{ marginBottom: "28px" }}>
          <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="card" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "48px 32px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Product Catalog is Locked
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, marginBottom: "32px" }}>
            Your account is currently on the <strong style={{ color: "var(--gold)" }}>FREE</strong> plan. Product catalogs are available on the premium <strong>Pro</strong> and <strong>Business</strong> plans.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <Link href="/dashboard/billing" className="btn-primary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
              💎 Upgrade to Pro or Business
            </Link>
            <Link href="/dashboard" className="btn-secondary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "6px" }}>
          Product Catalog Management
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Select one of your digital business cards below to manage its products, prices, and catalogs.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
          Select Card
        </h2>

        {cards.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛍</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "8px", fontWeight: 500 }}>No Digital Cards Found</p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "360px", margin: "0 auto" }}>
              Create a digital business card first before you can configure a product catalog.
            </p>
            <Link href="/dashboard/create" className="btn-primary" style={{ marginTop: "20px", display: "inline-flex", textDecoration: "none" }}>
              + Create Card
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {cards.map((c: any) => (
              <div key={c.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "20px",
                background: "var(--bg-elevated)",
                border: c.isLocked ? "1px solid rgba(244,63,94,0.3)" : "1px solid var(--bg-border)",
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "3px" }}>
                    {c.businessName}
                  </div>
                  {c.isLocked ? (
                    <div style={{ fontSize: "11px", color: "var(--error)", marginBottom: "4px" }}>
                      This card is locked because it exceeds your plan&apos;s card limit.
                    </div>
                  ) : (
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "var(--gold)" }}>
                      {cardUrlPrefix}{c.slug}
                    </div>
                  )}
                </div>
                <div>
                  {c.isLocked ? (
                    <Link href="/dashboard/billing" className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", textDecoration: "none", background: "var(--error)", borderColor: "var(--error)" }}>
                      Upgrade to Unlock 🔒
                    </Link>
                  ) : (
                    <Link href={`/dashboard/catalog/${c.slug}`} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", textDecoration: "none" }}>
                      Manage Catalog →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
