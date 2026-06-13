"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getCardData, getCatalogItemsBySlugAction, recordAnalyticsEventAction } from "@/app/card/actions";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { WhatsAppLogo } from "@/components/BrandLogos";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isVisible: boolean;
  sortOrder: number;
}

interface CardData {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  tagline: string;
  logoUrl: string;
  theme: string;
  phone: string;
  whatsapp: string;
  userPlan?: string;
}

interface ThemeConfig {
  bannerBg: string;
  textColor: string;
  textMuted: string;
  logoBg: string;
  logoColor: string;
  accentColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  bottomCircleBg: string;
  qrBtnBg: string;
}

const THEME_COLORS: Record<string, ThemeConfig> = {
  "dark-luxury": {
    bannerBg: "linear-gradient(135deg, #181412 0%, #090707 50%, #13100E 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    logoBg: "#ffffff",
    logoColor: "#181412",
    accentColor: "#E5C17C",
    pillBg: "rgba(229, 193, 124, 0.1)",
    pillText: "#E5C17C",
    pillBorder: "rgba(229, 193, 124, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
  },
  "rose-gold": {
    bannerBg: "linear-gradient(135deg, #1F1412 0%, #0D0807 50%, #1A0F0E 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    logoBg: "#ffffff",
    logoColor: "#1F1412",
    accentColor: "#FDA4AF",
    pillBg: "rgba(253, 164, 175, 0.1)",
    pillText: "#FDA4AF",
    pillBorder: "rgba(253, 164, 175, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
  },
  "minimal-white": {
    bannerBg: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)",
    textColor: "#0F172A",
    textMuted: "#475569",
    logoBg: "#0F172A",
    logoColor: "#ffffff",
    accentColor: "#0F172A",
    pillBg: "rgba(15, 23, 42, 0.06)",
    pillText: "#0F172A",
    pillBorder: "rgba(15, 23, 42, 0.15)",
    bottomCircleBg: "#e5e7eb",
    qrBtnBg: "rgba(0, 0, 0, 0.05)",
  },
  "teal-ocean": {
    bannerBg: "linear-gradient(135deg, #051B1B 0%, #010808 50%, #031515 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#010808",
    accentColor: "#2DD4BF",
    pillBg: "rgba(45, 212, 191, 0.1)",
    pillText: "#2DD4BF",
    pillBorder: "rgba(45, 212, 191, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
  },
  "navy-pro": {
    bannerBg: "linear-gradient(135deg, #080F1E 0%, #02050B 50%, #060B18 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#02050B",
    accentColor: "#7DD3FC",
    pillBg: "rgba(125, 211, 252, 0.1)",
    pillText: "#7DD3FC",
    pillBorder: "rgba(125, 211, 252, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
  },
  "burgundy-velvet": {
    bannerBg: "linear-gradient(135deg, #2A0914 0%, #0F0206 50%, #22050E 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#0F0206",
    accentColor: "#F43F5E",
    pillBg: "rgba(244, 63, 94, 0.1)",
    pillText: "#F43F5E",
    pillBorder: "rgba(244, 63, 94, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
  },
  "neon-city": {
    bannerBg: "linear-gradient(135deg, #05000C 0%, #000000 50%, #080017 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.85)",
    logoBg: "linear-gradient(135deg, #00F5FF 0%, #FF00FF 100%)",
    logoColor: "#ffffff",
    accentColor: "#00F5FF",
    pillBg: "rgba(0, 245, 255, 0.1)",
    pillText: "#00F5FF",
    pillBorder: "rgba(0, 245, 255, 0.35)",
    bottomCircleBg: "rgba(0, 245, 255, 0.18)",
    qrBtnBg: "rgba(0, 245, 255, 0.2)",
  },
  "royal-gold": {
    bannerBg: "linear-gradient(135deg, #181512 0%, #080706 50%, #201C18 100%)",
    textColor: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.75)",
    logoBg: "#ffffff",
    logoColor: "#080706",
    accentColor: "#FBBF24",
    pillBg: "rgba(251, 191, 36, 0.1)",
    pillText: "#FBBF24",
    pillBorder: "rgba(251, 191, 36, 0.3)",
    bottomCircleBg: "rgba(255, 255, 255, 0.08)",
    qrBtnBg: "rgba(255, 255, 255, 0.1)",
  },
};

export default function PublicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [card, setCard] = useState<CardData | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const openProduct = (item: CatalogItem) => {
    setSelectedItem(item);
    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}?item=${item.id}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  };

  const closeProduct = () => {
    setSelectedItem(null);
    if (typeof window !== "undefined") {
      const newUrl = window.location.pathname;
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  };

  useEffect(() => {
    if (items.length > 0 && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const itemId = urlParams.get("item");
      if (itemId) {
        const matched = items.find(i => i.id === itemId);
        if (matched) {
          setSelectedItem(matched);
        }
      }
    }
  }, [items]);

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const itemId = urlParams.get("item");
      if (itemId) {
        const matched = items.find(i => i.id === itemId);
        setSelectedItem(matched || null);
      } else {
        setSelectedItem(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [items]);

  useEffect(() => {
    async function loadData() {
      try {
        const cardData = await getCardData(slug);
        if (cardData) {
          setCard(cardData as any);
          const catalogItems = await getCatalogItemsBySlugAction(slug);
          setItems(catalogItems as any);
          
          // Track catalog view event
          recordAnalyticsEventAction(cardData.id, "click", "catalog");
        }
      } catch (err) {
        console.error("Failed to load public catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const trackOrderClick = async (itemName: string) => {
    if (card) {
      // Record analytics click
      const width = typeof window !== "undefined" ? window.innerWidth : 1024;
      const deviceType = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
      await recordAnalyticsEventAction(card.id, "click", `order-${itemName}`, deviceType);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "400px" }}>
          <p style={{ color: "var(--error)", marginBottom: "20px" }}>Business card not found</p>
          <Link href="/" className="btn-primary">Go to Home</Link>
        </div>
      </div>
    );
  }

  const theme = card.theme;
  const colors = THEME_COLORS[theme] || THEME_COLORS["dark-luxury"];
  const isLight = theme === "minimal-white";

  // Categories extraction
  const categories = ["All", ...Array.from(new Set(items.map(item => item.category || "General")))];

  // Clean WhatsApp phone number for wa.me link
  const formatWhatsappLink = (itemName: string, price: number, itemId?: string) => {
    let cleanNum = card.whatsapp.replace(/[^0-9]/g, "");
    if (cleanNum.length === 10) {
      cleanNum = "91" + cleanNum;
    }
    const message = `Hello! I would like to order this item:\n\n*Product Name:* ${itemName}\n*Price:* ₹${price}\n\nPlease let me know the availability and payment details. Thanks!`;
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  };

  // Filtered items
  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => (item.category || "General") === activeCategory);

  const pageBg = isLight ? "#F8FAFC" : (theme === "dark-luxury" ? "#0F0D0C" : (theme === "rose-gold" ? "#120B0A" : (theme === "teal-ocean" ? "#010A0A" : (theme === "navy-pro" ? "#020712" : (theme === "burgundy-velvet" ? "#120207" : (theme === "neon-city" ? "#080010" : (theme === "royal-gold" ? "#0F0E0B" : "var(--bg-base)")))))));

  return (
    <div style={{ minHeight: "100vh", background: pageBg, display: "flex", justifyContent: "center", padding: "20px 16px 80px", position: "relative", overflow: "hidden" }}>
      {/* Dynamic Immersive Background Blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: colors.accentColor,
          filter: "blur(120px)",
          opacity: isLight ? 0.05 : 0.08,
          animation: "floatBlob1 15s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          bottom: "15%",
          right: "5%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: isLight ? "#3b82f6" : colors.accentColor,
          filter: "blur(140px)",
          opacity: isLight ? 0.04 : 0.07,
          animation: "floatBlob2 18s ease-in-out infinite",
          animationDelay: "2s"
        }} />
      </div>

      {/* Dynamic Theme Animation Keyframes */}
      <style>{`
        @keyframes floatBlob1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatBlob2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>

      <div style={{
        width: "100%",
        maxWidth: "480px",
        background: colors.bannerBg,
        borderRadius: "32px",
        overflow: "hidden",
        boxShadow: isLight ? "0 20px 50px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.15)" : "var(--shadow-float)",
        border: isLight ? "1px solid #E5E7EB" : "none",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1
      }}>
        {/* Top Sticky Header */}
        <div style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          borderBottom: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          background: isLight ? "rgba(255,255,255,0.95)" : "rgba(10,10,10,0.9)",
          backdropFilter: "blur(10px)",
          zIndex: 100
        }}>
          <Link href={`/card/${card.slug}`} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: isLight ? "#F3F4F6" : "rgba(255,255,255,0.06)",
            color: colors.textColor,
            textDecoration: "none",
            marginRight: "12px",
            transition: "background 0.2s"
          }}>
            <ArrowLeft size={18} />
          </Link>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: colors.textColor,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: "2px"
            }}>{card.businessName}</h1>
            <p style={{
              fontSize: "11px",
              color: colors.textMuted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>{card.category}</p>
          </div>

          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: colors.logoBg,
            color: colors.logoColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "14px",
            overflow: "hidden",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
          }}>
            {card.logoUrl ? (
              <img src={card.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              card.businessName.charAt(0)
            )}
          </div>
        </div>

        {/* Page Banner Title */}
        <div style={{ padding: "28px 24px 20px", textAlign: "center", color: colors.textColor }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            background: colors.pillBg,
            border: `1px solid ${colors.pillBorder}`,
            color: colors.accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            fontSize: "20px"
          }}>
            <ShoppingBag size={20} />
          </div>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px", marginBottom: "6px" }}>Our Menu & Catalog</h2>
          <p style={{ fontSize: "13px", color: colors.textMuted, maxWidth: "340px", margin: "0 auto", lineHeight: 1.5 }}>
            Browse our offerings and order directly on WhatsApp.
          </p>
        </div>

        {/* Category Filter Horizontal Scroll */}
        {categories.length > 2 && (
          <div style={{
            display: "flex",
            gap: "8px",
            padding: "0 20px 16px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }} className="hide-scrollbar">
            {categories.map(cat => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    background: active ? colors.accentColor : isLight ? "#F3F4F6" : "rgba(255, 255, 255, 0.05)",
                    color: active ? (isLight ? "#ffffff" : "#000000") : colors.textColor,
                    border: active ? "none" : `1px solid ${isLight ? "#E5E7EB" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Products List */}
        <div style={{ flex: 1, padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 12px", color: colors.textMuted }}>
              <p style={{ fontSize: "14px" }}>No items available in this category.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => openProduct(item)}
                style={{
                  background: isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.03)",
                  border: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "20px",
                  padding: "16px",
                  display: "flex",
                  gap: "14px",
                  position: "relative",
                  transition: "transform 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                {/* Product Image */}
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "12px",
                  background: isLight ? "#F3F4F6" : "rgba(255, 255, 255, 0.03)",
                  border: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  overflow: "hidden",
                  flexShrink: 0
                }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    "📦"
                  )}
                </div>

                {/* Info & Buy Button */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <h3 style={{
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: colors.textColor,
                        lineHeight: 1.3,
                        margin: 0
                      }}>{item.name}</h3>
                      <span style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: colors.accentColor,
                        whiteSpace: "nowrap"
                      }}>
                        ₹{item.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <span style={{
                      fontSize: "9px",
                      background: colors.pillBg,
                      color: colors.pillText,
                      border: `1px solid ${colors.pillBorder}`,
                      borderRadius: "4px",
                      padding: "1px 6px",
                      display: "inline-block",
                      marginTop: "4px",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600
                    }}>
                      {item.category || "General"}
                    </span>

                    {item.description && (
                      <p style={{
                        fontSize: "12px",
                        color: colors.textMuted,
                        marginTop: "6px",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Buy WhatsApp Button */}
                  <a
                    href={formatWhatsappLink(item.name, item.price, item.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackOrderClick(item.name);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      background: "#25D366",
                      color: "#ffffff",
                      borderRadius: "12px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600,
                      textDecoration: "none",
                      marginTop: "12px",
                      transition: "transform 0.2s, background 0.2s",
                      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.2)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <WhatsAppLogo size={18} />
                    Order via WhatsApp
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Brand */}
        {card.userPlan !== "business" && (
          <div style={{
            background: isLight ? "#F9FAFB" : "rgba(0,0,0,0.1)",
            padding: "20px",
            textAlign: "center",
            borderTop: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.06)",
            fontSize: "11px",
            color: colors.textMuted
          }}>
            Powered by{" "}
            <Link href="/" target="_blank" style={{ color: colors.textColor, fontWeight: 700, textDecoration: "none" }}>
              CardVault
            </Link>
          </div>
        )}
      </div>

      {/* Product Details Modal (Amazon Style) */}
      {selectedItem && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backdropFilter: "blur(4px)"
        }} onClick={closeProduct}>
          <div style={{
            background: isLight ? "#ffffff" : "#121212",
            border: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "24px",
            maxWidth: "400px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            color: colors.textColor,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
          }} onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closeProduct}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: isLight ? "#F3F4F6" : "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                color: colors.textColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Product Image */}
            <div style={{
              width: "100%",
              height: "300px",
              borderRadius: "16px",
              background: isLight ? "#F3F4F6" : "rgba(255,255,255,0.02)",
              border: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
              overflow: "hidden",
              marginBottom: "20px"
            }}>
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                "📦"
              )}
            </div>

            {/* Category badge */}
            <span style={{
              fontSize: "10px",
              background: colors.pillBg,
              color: colors.pillText,
              border: `1px solid ${colors.pillBorder}`,
              borderRadius: "4px",
              padding: "2px 8px",
              display: "inline-block",
              marginBottom: "10px",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              textTransform: "uppercase"
            }}>
              {selectedItem.category || "General"}
            </span>

            {/* Name */}
            <h2 style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 800,
              fontSize: "20px",
              color: colors.textColor,
              lineHeight: 1.3,
              margin: "0 0 8px 0"
            }}>
              {selectedItem.name}
            </h2>

            {/* Price */}
            <div style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "22px",
              fontWeight: 800,
              color: colors.accentColor,
              marginBottom: "16px"
            }}>
              ₹{selectedItem.price.toLocaleString("en-IN")}
            </div>

            {/* Description */}
            <div style={{
              borderTop: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.08)",
              paddingTop: "16px",
              marginBottom: "24px"
            }}>
              <h4 style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: colors.textMuted,
                margin: "0 0 6px 0"
              }}>
                Product Details
              </h4>
              <p style={{
                fontSize: "13px",
                color: isLight ? "#475569" : "rgba(255,255,255,0.7)",
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: "pre-line"
              }}>
                {selectedItem.description || "No additional description available."}
              </p>
            </div>

            {/* Action button inside Modal */}
            <a
              href={formatWhatsappLink(selectedItem.name, selectedItem.price, selectedItem.id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOrderClick(selectedItem.name)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "#25D366",
                color: "#ffffff",
                borderRadius: "14px",
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.3)"
              }}
            >
              <WhatsAppLogo size={20} />
              Order via WhatsApp
            </a>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
