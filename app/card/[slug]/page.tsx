"use client";
import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { MOCK_CARDS, getBusinessStatus, type CardData, COUNTRY_CODES, THEME_COLORS, type ThemeConfig } from "@/lib/cardData";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { UserPlus, BookOpen, Calendar, Phone, Clock, MapPin, QrCode } from "lucide-react";
import {
  GoogleReviewLogo,
  GPayLogo,
  InstagramLogo,
  FacebookLogo,
  YouTubeLogo,
  WhatsAppLogo,
  GmailLogo,
  GlobeLogo,
  LinkedInLogo,
  TwitterLogo
} from "@/components/BrandLogos";

interface CardPageProps {
  params: Promise<{ slug: string }>;
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${mStr} ${ampm}`;
}

function getHoursSummary(hours: Record<string, { open: string; close: string; closed: boolean }>) {
  if (!hours || !hours.mon) return "Hours Not Configured";
  
  const mon = hours.mon;
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const isSameAllWeek = days.every(d => 
    hours[d] && 
    hours[d].open === mon.open && 
    hours[d].close === mon.close && 
    hours[d].closed === mon.closed
  );

  if (isSameAllWeek) {
    if (mon.closed) return "Mon - Sun: Closed";
    return `Mon - Sun: ${formatTime(mon.open)} - ${formatTime(mon.close)}`;
  }

  const isSameMonSat = ["tue", "wed", "thu", "fri", "sat"].every(d => 
    hours[d] && 
    hours[d].open === mon.open && 
    hours[d].close === mon.close && 
    hours[d].closed === mon.closed
  );

  if (isSameMonSat) {
    const weekdayStr = mon.closed ? "Mon - Sat: Closed" : `Mon - Sat: ${formatTime(mon.open)} - ${formatTime(mon.close)}`;
    const sunStr = hours.sun.closed ? "Sun: Closed" : `Sun: ${formatTime(hours.sun.open)} - ${formatTime(hours.sun.close)}`;
    return `${weekdayStr} · ${sunStr}`;
  }

  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = dayNames[new Date().getDay()];
  const todayHours = hours[todayKey];
  if (!todayHours || todayHours.closed) return "Closed Today";
  return `Today: ${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
}

import { getCardData, recordAnalyticsEventAction, getCurrentUserAction } from "@/app/card/actions";

export default function CardPage({ params }: CardPageProps) {
  const unwrappedParams = use(params);
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ isOpen: false, message: "Loading..." });
  const [showQR, setShowQR] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState("");
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    setCurrentDateStr(new Date().toLocaleDateString("en-US", options));
  }, []);
  const [showBooking, setShowBooking] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await getCurrentUserAction();
        if (u) {
          setCurrentUser(u);
        }
      } catch (err) {
        console.error("Failed to load user session:", err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function load() {
      let activeCard: any = null;
      try {
        const data = await getCardData(unwrappedParams.slug);
        if (data) {
          if ((data as any).expired) {
            setCard({ expired: true } as any);
            activeCard = null;
          } else {
            setCard(data as any);
            const businessHours = data.hours || {};
            setStatus(getBusinessStatus(businessHours));
            activeCard = data;
          }
        } else {
          const mock = MOCK_CARDS[unwrappedParams.slug] || MOCK_CARDS["demo"];
          setCard(mock);
          const businessHours = mock.hours || {};
          setStatus(getBusinessStatus(businessHours));
          activeCard = mock;
        }
      } catch (err) {
        console.error("Error loading card details:", err);
        const mock = MOCK_CARDS["demo"];
        setCard(mock);
        setStatus(getBusinessStatus(mock.hours || {}));
        activeCard = mock;
      } finally {
        setLoading(false);
      }

      if (activeCard && activeCard.id) {
        try {
          const width = typeof window !== "undefined" ? window.innerWidth : 1024;
          const deviceType = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
          let referrer = "direct";
          if (typeof document !== "undefined" && document.referrer) {
            try {
              referrer = new URL(document.referrer).hostname.slice(0, 30);
            } catch (e) {
              referrer = document.referrer.slice(0, 30) || "direct";
            }
          }
          await recordAnalyticsEventAction(activeCard.id, "view", undefined, deviceType, "Unknown", referrer);
        } catch (analyticsErr) {
          console.error("Failed to record view analytics:", analyticsErr);
        }
      }
    }
    load();
  }, [unwrappedParams.slug]);

  const trackClick = async (buttonName: string) => {
    if (card && card.id) {
      const width = typeof window !== "undefined" ? window.innerWidth : 1024;
      const deviceType = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
      await recordAnalyticsEventAction(card.id, "click", buttonName, deviceType);
    }
  };

  useEffect(() => {
    if (!card) return;
    const interval = setInterval(() => setStatus(getBusinessStatus(card.hours)), 60000);
    return () => clearInterval(interval);
  }, [card]);

  const handleSaveContact = () => {
    if (!card) return;
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:${card.businessName}
TEL:${card.phone}
EMAIL:${card.email}
URL:${card.website}
ADR:;;${card.address};;;
ORG:${card.businessName}
TITLE:${card.category}
NOTE:${card.tagline}
END:VCARD`;
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.businessName}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    setContactSaved(true);
    setTimeout(() => setContactSaved(false), 2500);
  };

  if (loading || !card) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-secondary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px" }}>Loading digital card...</p>
        </div>
      </div>
    );
  }

  if (card && (card as any).expired) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "var(--text-primary)",
        padding: "20px",
        fontFamily: "Outfit, sans-serif",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "420px", width: "100%", background: "var(--bg-card)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-xl)", padding: "40px 24px", boxShadow: "var(--shadow-card)" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>⏰</div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
            Card Validity Expired
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "28px" }}>
            This digital business card has been deactivated because the owner's subscription has expired.
          </p>
          <div style={{ height: "1px", background: "var(--bg-border)", marginBottom: "24px" }} />
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Are you the business owner?
          </p>
          <Link href="/sign-in" className="btn-primary" style={{ display: "inline-flex", justifyContent: "center", width: "100%", textDecoration: "none", fontSize: "14px", padding: "12px" }}>
            Sign In & Renew Plan
          </Link>
        </div>
        
        {/* Credit line */}
        <p style={{ marginTop: "24px", fontSize: "11px", color: "var(--text-muted)" }}>
          This website is made by Dhairya Jesani
        </p>
      </div>
    );
  }

  const theme = card.theme;
  const colors = THEME_COLORS[theme] || THEME_COLORS["dark-luxury"];

  const cardUrl = typeof window !== "undefined" ? `${window.location.origin}/card/${card.slug}` : `cardvault.in/card/${card.slug}`;

  const isLight = theme === "minimal-white";
  const pageBg = isLight ? "#F8FAFC" : (theme === "dark-luxury" ? "#0F0D0C" : (theme === "rose-gold" ? "#120B0A" : (theme === "teal-ocean" ? "#010A0A" : (theme === "navy-pro" ? "#020712" : (theme === "burgundy-velvet" ? "#120207" : (theme === "neon-city" ? "#080010" : (theme === "royal-gold" ? "#0F0E0B" : "var(--bg-base)")))))));

  return (
    <div style={{ minHeight: "100vh", background: pageBg, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 16px 120px", position: "relative", overflow: "hidden" }}>
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
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes goldGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(229,193,124,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 22px rgba(229,193,124,0.3); }
        }
        @keyframes roseGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(253,164,175,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 22px rgba(253,164,175,0.3); }
        }
        @keyframes tealGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(45,212,191,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 22px rgba(45,212,191,0.35); }
        }
        @keyframes navyGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(125,211,252,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 22px rgba(125,211,252,0.3); }
        }
        @keyframes burgundyGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(244,63,94,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 22px rgba(244,63,94,0.3); }
        }
        @keyframes neonGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(0,245,255,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 25px rgba(0,245,255,0.4); }
        }
        @keyframes royalGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 rgba(251,191,36,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 22px rgba(251,191,36,0.3); }
        }
        @keyframes minimalShadow {
          0%, 100% { box-shadow: 0 15px 40px rgba(0,0,0,0.08); }
          50% { box-shadow: 0 22px 48px rgba(0,0,0,0.14); }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        
        .card-glow-dark-luxury { animation: scaleIn 0.4s var(--ease-out), goldGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        .card-glow-rose-gold { animation: scaleIn 0.4s var(--ease-out), roseGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        .card-glow-minimal-white { animation: scaleIn 0.4s var(--ease-out), minimalShadow 6s ease-in-out infinite; }
        .card-glow-teal-ocean { animation: scaleIn 0.4s var(--ease-out), tealGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        .card-glow-navy-pro { animation: scaleIn 0.4s var(--ease-out), navyGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        .card-glow-burgundy-velvet { animation: scaleIn 0.4s var(--ease-out), burgundyGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        .card-glow-neon-city { animation: scaleIn 0.4s var(--ease-out), neonGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
        .card-glow-royal-gold { animation: scaleIn 0.4s var(--ease-out), royalGlow 6s ease-in-out infinite, gradientShift 12s ease infinite; }
      `}</style>

      {/* Redesigned Card Container */}
      <div
        data-theme={theme}
        className={`card-glow-${theme}`}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: colors.bannerBg,
          backgroundSize: "200% 200%",
          borderRadius: "32px",
          overflow: "hidden",
          height: "fit-content",
          position: "relative",
          border: isLight ? "1px solid #E5E7EB" : "none"
        }}
      >
        {/* QR Code Trigger on top right */}
        <button
          onClick={() => setShowQR(true)}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: colors.qrBtnBg,
            border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.25)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: colors.textColor,
            transition: "all 0.2s",
            zIndex: 10
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          title="Scan QR Code"
        >
          <QrCode size={18} />
        </button>

        {/* Top Banner (Business Info) */}
        <div style={{
          padding: "36px 24px 24px",
          textAlign: "center",
          color: colors.textColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative"
        }}>
          {/* Logo Circle */}
          <div style={{
            position: "relative",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Highlight ring (outer glow) */}
            <div style={{
              position: "absolute",
              width: "124px",
              height: "124px",
              borderRadius: "50%",
              background: isLight 
                ? "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.3) 100%)"
                : `linear-gradient(135deg, ${colors.accentColor}60 0%, ${colors.accentColor}15 100%)`,
              boxShadow: isLight
                ? "0 0 0 2px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.12)"
                : `0 0 0 2px ${colors.accentColor}80, 0 0 30px ${colors.accentColor}50, 0 0 60px ${colors.accentColor}20`,
              animation: "logoPulse 3s ease-in-out infinite",
              zIndex: 0,
            }} />
            {/* Logo circle container */}
            <div style={{
              width: "108px",
              height: "108px",
              borderRadius: "50%",
              background: isLight ? "#ffffff" : "transparent",
              border: isLight ? "3px solid rgba(0,0,0,0.15)" : `3px solid ${colors.accentColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              fontWeight: 700,
              color: colors.logoColor,
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
              transform: "translateZ(0)",
              willChange: "transform",
              boxShadow: isLight 
                ? "0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)" 
                : `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}>
              {card.logoUrl ? (
                <img 
                  src={card.logoUrl} 
                  alt={card.businessName} 
                  style={{ 
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }} 
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: colors.logoBg,
                  color: colors.logoColor,
                  fontSize: "42px",
                  fontWeight: 700,
                }}>
                  {card.businessName.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <h1 style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            color: colors.textColor,
            textShadow: isLight ? "none" : `0 0 8px ${colors.accentColor}a0, 0 0 20px ${colors.accentColor}30`,
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            {card.businessName}
            {card.isVerified && (
              <span style={{ color: isLight ? "#0284C7" : "#38BDF8", fontSize: "16px", display: "inline-flex" }} title="Verified Business">✓</span>
            )}
          </h1>

          <p style={{
            fontSize: "12px",
            color: colors.textMuted,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "12px"
          }}>
            {card.category}
          </p>

          {(card.address || card.city) && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "3px",
              justifyContent: "center",
              maxWidth: "300px",
              fontSize: "12px",
              color: colors.textMuted
            }}>
              <MapPin size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{card.address ? `${card.address}${card.city ? `, ${card.city}` : ""}` : card.city}</span>
            </div>
          )}
        </div>

        {/* White Card Action Container */}
        <div style={{
          background: colors.actionBg,
          borderTopLeftRadius: "32px",
          borderTopRightRadius: "32px",
          padding: "24px 20px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderTop: isLight ? "1px solid #E5E7EB" : `1px solid ${colors.actionBorder}`
        }}>
          {/* Tagline */}
          {card.tagline && (
            <p style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              fontStyle: "italic",
              color: colors.actionTextColor,
              textAlign: "center",
              lineHeight: 1.5,
              marginBottom: "8px",
              padding: "0 12px"
            }}>
              &ldquo;{card.tagline}&rdquo;
            </p>
          )}

          {/* Welcome Message */}
          <p style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontSize: "13px",
            color: colors.actionTextMuted,
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: "18px",
            padding: "0 8px"
          }}>
            Thanks for visiting {card.businessName}! Connect with us, share your experience, and stay updated.
          </p>

          {/* Current Date Display */}
          {currentDateStr && (
            <p style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "Outfit, sans-serif",
              color: colors.textColor,
              marginBottom: "10px",
              letterSpacing: "0.02em"
            }}>
              📅 {currentDateStr}
            </p>
          )}

          {/* Business Hours Pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: colors.pillBg,
            border: `1px solid ${colors.pillBorder}`,
            borderRadius: "9999px",
            padding: "8px 18px",
            marginBottom: "24px",
            fontSize: "12px",
            fontWeight: 600,
            color: colors.pillText,
            fontFamily: "Outfit, sans-serif",
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: status.isOpen ? "#22C55E" : "#EF4444",
              display: "inline-block",
              boxShadow: status.isOpen ? "0 0 8px #22C55E" : "0 0 8px #EF4444"
            }} />
            <span>{status.message}</span>
          </div>

          {/* 3-Column Action Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "14px 10px",
            width: "100%",
            marginBottom: "20px"
          }}>
            {/* Save Contact */}
            {card.phone && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label={contactSaved ? "✓ Saved!" : "Save Contact"}
                icon={<UserPlus size={38} color="#2563EB" />}
                onClick={() => {
                  handleSaveContact();
                  trackClick("save_contact");
                }}
              />
            )}

            {/* Review Us */}
            {card.showReviewButton && card.googleReviewUrl && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Review Us"
                icon={<GoogleReviewLogo size={54} />}
                href={`/card/${card.slug}/review`}
                onClick={() => trackClick("review")}
              />
            )}

            {/* Pay Now (UPI) */}
            {card.upiId && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Pay Now"
                icon={<GPayLogo size={38} />}
                onClick={() => {
                  trackClick("pay");
                  setShowPayModal(true);
                }}
              />
            )}

            {/* Instagram */}
            {card.instagram && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Instagram"
                icon={<InstagramLogo size={56} />}
                href={card.instagram}
                onClick={() => trackClick("instagram")}
              />
            )}

            {/* Facebook */}
            {card.facebook && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Facebook"
                icon={<FacebookLogo size={54} />}
                href={card.facebook}
                onClick={() => trackClick("facebook")}
              />
            )}

            {/* YouTube */}
            {card.youtube && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="YouTube"
                icon={<YouTubeLogo size={54} />}
                href={card.youtube}
                onClick={() => trackClick("youtube")}
              />
            )}

            {/* WhatsApp Community */}
            {card.whatsappCommunity && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="WA Community"
                icon={<WhatsAppLogo size={54} />}
                href={card.whatsappCommunity}
                onClick={() => trackClick("whatsapp_community")}
              />
            )}

            {/* Our Menu / Catalog */}
            {card.showCatalog && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Our Menu / Catalog"
                icon={<BookOpen size={38} color="#6366F1" />}
                href={`/card/${card.slug}/catalog`}
                onClick={() => trackClick("catalog")}
              />
            )}

            {/* Book Appointment */}
            {card.showBooking && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Book Appointment"
                icon={<Calendar size={38} color="#EC4899" />}
                onClick={() => {
                  setShowBooking(true);
                  trackClick("booking");
                }}
              />
            )}

            {card.showDetailsForm && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Send Details"
                icon={<BookOpen size={38} color="#10B981" />}
                onClick={() => {
                  setShowDetailsSheet(true);
                  trackClick("details_form");
                }}
              />
            )}

            {/* LinkedIn */}
            {card.linkedin && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="LinkedIn"
                icon={<LinkedInLogo size={56} />}
                href={card.linkedin.startsWith("http") ? card.linkedin : `https://${card.linkedin}`}
                onClick={() => trackClick("linkedin")}
              />
            )}

            {/* Twitter/X */}
            {card.twitter && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Twitter/X"
                icon={<TwitterLogo size={54} />}
                href={card.twitter.startsWith("http") ? card.twitter : `https://${card.twitter}`}
                onClick={() => trackClick("twitter")}
              />
            )}

            {/* Locate Us */}
            {card.googleMapsUrl && (
              <GridItem bg={colors.gridItemBg} textColor={colors.gridItemText} borderColor={colors.gridItemBorder} isLight={isLight}
                label="Locate Us"
                icon={<MapPin size={38} color="#EA4335" />}
                href={card.googleMapsUrl}
                onClick={() => trackClick("location")}
              />
            )}
          </div>
        </div>

        {/* Bottom Contact Navigation Bar */}
        <div style={{
          background: colors.bannerBg,
          padding: "20px 20px 16px",
          borderBottomLeftRadius: "32px",
          borderBottomRightRadius: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderTop: isLight ? "1px solid #E5E7EB" : "none"
        }}>
          {/* Quick Communication Grid */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            maxWidth: "320px",
            marginBottom: "16px"
          }}>
            {/* Call */}
            {card.phone && (
              <a href={`tel:${card.phone}`} style={bottomLinkStyle} onClick={() => trackClick("call")}>
                <div style={{ ...bottomCircleStyle, background: "#22C55E" }}>
                  <Phone size={32} color="#ffffff" fill="#ffffff" />
                </div>
                <span style={{ ...bottomLabelStyle, color: colors.textColor }}>Phone</span>
              </a>
            )}

            {/* WhatsApp */}
            {card.whatsapp && (
              <a
                href={`https://wa.me/${card.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={bottomLinkStyle}
                onClick={() => trackClick("whatsapp")}
              >
                <div style={{ ...bottomCircleStyle, background: "#25D366" }}>
                  <WhatsAppLogo size={40} />
                </div>
                <span style={{ ...bottomLabelStyle, color: colors.textColor }}>WhatsApp</span>
              </a>
            )}

            {/* Email */}
            {card.email && (
              <a href={`mailto:${card.email}`} style={bottomLinkStyle} onClick={() => trackClick("email")}>
                <div style={{ ...bottomCircleStyle, background: colors.bottomCircleBg, border: isLight ? "1px solid #D1D5DB" : "none" }}>
                  <GmailLogo size={34} />
                </div>
                <span style={{ ...bottomLabelStyle, color: colors.textColor }}>Email</span>
              </a>
            )}

            {/* Website */}
            {card.website && (
              <a href={card.website} target="_blank" rel="noopener noreferrer" style={bottomLinkStyle} onClick={() => trackClick("website")}>
                <div style={{ ...bottomCircleStyle, background: isLight ? "#F3F4F6" : "#3b82f6", border: isLight ? "1px solid #D1D5DB" : "none" }}>
                  <GlobeLogo size={34} />
                </div>
                <span style={{ ...bottomLabelStyle, color: colors.textColor }}>Website</span>
              </a>
            )}
          </div>

          {/* Footer Branding — always visible for all plans except business */}
          {card.userPlan !== "business" && (
            <div style={{
              width: "100%",
              textAlign: "center",
              borderTop: isLight ? "1px solid #E5E7EB" : "1px solid rgba(255,255,255,0.15)",
              paddingTop: "12px",
              fontSize: "11px",
              color: isLight ? "#6B7280" : "rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}>
              <span>⚡</span>
              <span>Powered by</span>
              <Link href="/" target="_blank" style={{
                color: isLight ? "#111827" : (theme === "neon-city" ? "#FF00FF" : colors.accentColor),
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: "0.01em",
                textShadow: theme === "neon-city" ? "0 0 8px rgba(255, 0, 255, 0.6)" : "none"
              }}>
                CardVault
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backdropFilter: "blur(4px)"
        }} onClick={() => setShowQR(false)}>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 28px 24px",
            textAlign: "center",
            maxWidth: "320px",
            width: "100%",
            animation: "scaleIn 0.3s var(--ease-spring)",
          }} onClick={e => e.stopPropagation()}>
            {/* Business name header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: colors.bannerBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: colors.textColor, overflow: "hidden", flexShrink: 0 }}>
                {card.logoUrl ? <img src={card.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : card.businessName.charAt(0)}
              </div>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "17px", color: "var(--text-primary)", margin: 0 }}>
                {card.businessName}
              </h3>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "20px" }}>
              Scan QR to open digital card
            </p>

            {/* Real QR Code */}
            <div style={{
              width: "210px",
              height: "210px",
              background: "#ffffff",
              borderRadius: "16px",
              margin: "0 auto 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cardUrl)}&bgcolor=ffffff&color=000000&margin=0`}
                alt={`QR Code for ${card.businessName}`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* URL display — like payment QR shows UPI ID */}
            <div style={{
              background: "var(--bg-base)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "14px 0 20px",
              gap: "8px"
            }}>
              <div style={{ textAlign: "left", overflow: "hidden", flex: 1 }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Card URL</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>
                  {cardUrl.replace(/^https?:\/\//, "")}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cardUrl);
                  alert("Card URL copied!");
                }}
                style={{
                  background: "var(--gold-glow)",
                  border: "1px solid rgba(212,168,67,0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "var(--gold)",
                  cursor: "pointer",
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                Copy
              </button>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Close
            </button>

            {/* Powered by footer inside modal */}
            <p style={{ marginTop: "14px", fontSize: "10px", color: "var(--text-muted)" }}>
              Powered by <Link href="/" target="_blank" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>CardVault</Link>
            </p>
          </div>
        </div>
      )}

      {/* UPI Pay Modal */}
      {showPayModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backdropFilter: "blur(4px)"
        }} onClick={() => setShowPayModal(false)}>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            textAlign: "center",
            maxWidth: "340px",
            width: "100%",
            animation: "scaleIn 0.3s var(--ease-spring)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💸</div>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)", marginBottom: "4px" }}>
              Pay via UPI
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "16px" }}>
              Scan the QR Code with Google Pay, PhonePe, Paytm, or any UPI app to pay directly.
            </p>
            
            {/* UPI QR Image */}
            <div style={{
              width: "180px",
              height: "180px",
              background: "#fff",
              borderRadius: "12px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${card.upiId}&pn=${encodeURIComponent(card.businessName)}&cu=INR`)}`}
                alt="UPI Payment QR Code"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* UPI details */}
            <div style={{
              background: "var(--bg-base)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              gap: "8px"
            }}>
              <div style={{ textAlign: "left", overflow: "hidden", flex: 1 }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>UPI ID</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>
                  {card.upiId}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(card.upiId || "");
                  alert("UPI ID Copied!");
                }}
                style={{
                  background: "var(--gold-glow)",
                  border: "1px solid rgba(212,168,67,0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "var(--gold)",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Copy
              </button>
            </div>

            <button
              onClick={() => setShowPayModal(false)}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Booking Sheet */}
      {showBooking && (
        <BookingSheet 
          cardId={card.id || ""} 
          cardName={card.businessName} 
          whatsappNumber={card.whatsapp || card.phone || ""} 
          hours={card.hours}
          bookingFields={card.bookingFields || "service,birthday,anniversary"}
          currentUser={currentUser}
          onClose={() => setShowBooking(false)} 
        />
      )}

      {/* Details Sheet (Lead collection form) */}
      {showDetailsSheet && (
        <DetailsSheet 
          cardId={card.id || ""} 
          cardName={card.businessName} 
          whatsappNumber={card.whatsapp || card.phone || ""} 
          detailsFormFields={card.detailsFormFields || "phone,birthday,anniversary"}
          currentUser={currentUser}
          onClose={() => setShowDetailsSheet(false)} 
          googleFormUrl={(card as any).googleFormUrl}
          googleFormFields={(card as any).googleFormFields}
          userPlan={(card as any).userPlan}
        />
      )}
    </div>
  );
}

// Subcomponents & Styles
function GridItem({
  label, icon, href, onClick, bg, textColor, borderColor, isLight = true
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  isLight?: boolean;
}) {
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        transition: "transform 0.2s var(--ease-out)",
        textAlign: "center",
        padding: "10px 4px",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
      <div
        className={isLight ? "grid-item-bubble-light" : "grid-item-bubble"}
        style={{
          width: "82px",
          height: "82px",
          borderRadius: "50%",
          background: bg || "#F3F4F6",
          border: `1px solid ${borderColor || "transparent"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.15)",
          overflow: "hidden"
        }}
      >
        {icon}
      </div>
      <span style={{
        fontFamily: "Outfit, sans-serif",
        fontWeight: 600,
        fontSize: "12px",
        color: textColor || "#1F2937",
        lineHeight: 1.25
      }}>{label}</span>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none" }} target={href.startsWith("http") ? "_blank" : "_self"} rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <div onClick={onClick} style={{ userSelect: "none" }}>
      {content}
    </div>
  );
}

const bottomLinkStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  textDecoration: "none",
  width: "64px"
};

const bottomCircleStyle: React.CSSProperties = {
  width: "74px",
  height: "74px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
  transition: "transform 0.2s",
  overflow: "hidden"
};

const bottomLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "Outfit, sans-serif",
  fontWeight: 600,
  textAlign: "center"
};

import { createBookingAction, verifyGoogleFormLinkAction } from "@/app/card/actions";

function BookingSheet({ cardId, cardName, whatsappNumber, hours, bookingFields, currentUser, onClose }: { cardId: string; cardName: string; whatsappNumber: string; hours: any; bookingFields: string; currentUser: any; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", service: "", birthday: "", anniversary: "" });
  const fields = (bookingFields || "service,birthday,anniversary").split(",").map(f => f.trim().toLowerCase());
  const showService = fields.includes("service");
  const showBirthday = fields.includes("birthday");
  const showAnniversary = fields.includes("anniversary");
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneNational, setPhoneNational] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Prefill hook removed so customers enter their own name and phone.

  useEffect(() => {
    if (!form.date || !form.time || !hours) {
      setWarningMessage(null);
      return;
    }
    try {
      const hoursConfig = typeof hours === "string" ? JSON.parse(hours) : hours;
      const [year, month, day] = form.date.split("-").map(Number);
      const bookingDateObj = new Date(year, month - 1, day);
      const dayIndex = bookingDateObj.getDay();
      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayKey = dayKeys[dayIndex];
      const daySchedule = hoursConfig[dayKey];

      if (daySchedule) {
        const dayLabels: Record<string, string> = {
          mon: "Monday",
          tue: "Tuesday",
          wed: "Wednesday",
          thu: "Thursday",
          fri: "Friday",
          sat: "Saturday",
          sun: "Sunday"
        };
        const dayLabel = dayLabels[dayKey] || dayKey;

        if (daySchedule.closed) {
          setWarningMessage(`⚠️ The business is closed on ${dayLabel}. Please choose another day.`);
          return;
        }

        const parseTimeToMinutes = (timeStr: string): number => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const formatTimeHHMM = (timeStr: string): string => {
          const [hStr, mStr] = timeStr.split(":");
          const h = parseInt(hStr);
          const ampm = h >= 12 ? "PM" : "AM";
          const displayH = h % 12 || 12;
          return `${displayH}:${mStr} ${ampm}`;
        };

        const openMins = parseTimeToMinutes(daySchedule.open);
        const closeMins = parseTimeToMinutes(daySchedule.close);
        const bookingMins = parseTimeToMinutes(form.time);

        if (bookingMins < openMins || bookingMins >= closeMins) {
          setWarningMessage(`⚠️ Outside working hours. On ${dayLabel}, working hours are from ${formatTimeHHMM(daySchedule.open)} to ${formatTimeHHMM(daySchedule.close)}.`);
          return;
        }
      }
      setWarningMessage(null);
    } catch (e) {
      console.error(e);
      setWarningMessage(null);
    }
  }, [form.date, form.time, hours]);

  const updatePhone = (code: string, national: string) => {
    setPhoneCode(code);
    setPhoneNational(national);
    const combined = national.trim() ? `${code} ${national.trim()}` : "";
    setForm(prev => ({ ...prev, phone: combined }));
  };

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBookingAction(cardId, form);
      setSubmitted(true);

      if (whatsappNumber) {
        let cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
        if (cleanPhone.length === 10) {
          cleanPhone = "91" + cleanPhone;
        }

        const formattedTime = formatTime(form.time);
        
        let displayDate = form.date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
          const [yyyy, mm, dd] = form.date.split("-");
          displayDate = `${dd}-${mm}-${yyyy}`;
        }

        const msg = `Hello! I would like to book an appointment.\nName: ${form.name}\nPhone: ${form.phone}${form.service ? `\nService: ${form.service}` : ""}\nDate: ${displayDate}\nTime: ${formattedTime}`;
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        if (typeof window !== "undefined" && typeof window.open === "function") {
          window.open(whatsappUrl, "_blank");
        }
      }
    } catch (err: any) {
      if (err?.message?.startsWith("SlotAlreadyBooked:")) {
        alert(err.message.replace("SlotAlreadyBooked: ", ""));
      } else if (err?.message?.startsWith("BookingOutsideWorkingHours:")) {
        alert(err.message.replace("BookingOutsideWorkingHours: ", ""));
      } else {
        alert("Failed to confirm booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ animation: "slideInUp 0.35s var(--ease-out)" }}>
        <div className="bottom-sheet-handle" />
        {!submitted ? (
          <>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", marginBottom: "6px" }}>
              Book Appointment
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>at {cardName}</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label htmlFor="booking-name" className="input-label">Your Name</label>
                <input id="booking-name" className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label htmlFor="booking-phone" className="input-label">Phone Number</label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-elevated)",
                  border: phoneFocused ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                  boxShadow: phoneFocused ? "0 0 0 1px var(--gold)" : "none",
                  borderRadius: "var(--radius-md)",
                  width: "100%",
                  height: "42px",
                  overflow: "visible",
                  position: "relative",
                  transition: "all 0.2s ease",
                  zIndex: 20
                }}>
                  <CountryCodeSelect value={phoneCode} onChange={val => updatePhone(val, phoneNational)} />
                  <div style={{ width: "1px", height: "20px", background: "var(--bg-border)", flexShrink: 0 }} />
                  <input
                    id="booking-phone"
                    className="input-field"
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNational}
                    onChange={e => updatePhone(phoneCode, e.target.value)}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    style={{
                      flex: 1,
                      height: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "0 12px",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      fontFamily: "Outfit, sans-serif",
                      outline: "none",
                      boxShadow: "none"
                    }}
                    required
                  />
                </div>
              </div>

              {showService && (
                <div>
                  <label htmlFor="booking-service" className="input-label">Service</label>
                  <input
                    id="booking-service"
                    className="input-field"
                    placeholder="Service"
                    value={form.service}
                    onChange={e => setForm({ ...form, service: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Optional: Birthday & Anniversary */}
              {(showBirthday || showAnniversary) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {showBirthday ? (
                    <div>
                      <label htmlFor="booking-birthday" className="input-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Birthday <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input id="booking-birthday" className="input-field" type="date" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} />
                    </div>
                  ) : <div />}
                  {showAnniversary ? (
                    <div>
                      <label htmlFor="booking-anniversary" className="input-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Anniversary <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input id="booking-anniversary" className="input-field" type="date" value={form.anniversary} onChange={e => setForm({...form, anniversary: e.target.value})} />
                    </div>
                  ) : <div />}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label htmlFor="booking-date" className="input-label">Date</label>
                  <input id="booking-date" className="input-field" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div>
                  <label htmlFor="booking-time" className="input-label">Time</label>
                  <input id="booking-time" className="input-field" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
                </div>
              </div>
              {warningMessage && (
                <div style={{
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.25)",
                  color: "var(--error)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  fontSize: "12px",
                  fontFamily: "Outfit, sans-serif",
                  lineHeight: 1.4,
                  marginBottom: "4px"
                }}>
                  {warningMessage}
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }} disabled={submitting}>
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", marginBottom: "8px" }}>
              Booking Details Sent!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
              Your booking details have been sent on WhatsApp. Please send the message on WhatsApp to confirm your slot.
            </p>
            <button onClick={onClose} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Done
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function DetailsSheet({ 
  cardId, 
  cardName, 
  whatsappNumber, 
  detailsFormFields, 
  currentUser, 
  onClose,
  googleFormUrl,
  googleFormFields,
  userPlan
}: { 
  cardId: string; 
  cardName: string; 
  whatsappNumber: string; 
  detailsFormFields: string; 
  currentUser: any; 
  onClose: () => void;
  googleFormUrl?: string | null;
  googleFormFields?: string | null;
  userPlan?: string;
}) {
  const fields = (detailsFormFields || "phone,birthday,anniversary").split(',').filter(Boolean);
  const showBirthday = fields.includes("birthday");
  const showAnniversary = fields.includes("anniversary");

  const [form, setForm] = useState({ name: "", phone: "", birthday: "", anniversary: "" });
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneNational, setPhoneNational] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prefill hook removed so customers enter their own name and phone.

  const updatePhone = (code: string, national: string) => {
    setPhoneCode(code);
    setPhoneNational(national);
    const combined = national.trim() ? `${code} ${national.trim()}` : "";
    setForm(prev => ({ ...prev, phone: combined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      alert("Name and Phone Number are required.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Always save locally to Prisma
      await createBookingAction(cardId, {
        name: form.name,
        phone: form.phone,
        service: "",
        date: "",
        time: "",
        birthday: form.birthday || undefined,
        anniversary: form.anniversary || undefined
      });

      // 2. Submit to Google Form if URL is set
      let submittedToGoogle = false;
      if (googleFormUrl) {
        try {
          const reachability = await verifyGoogleFormLinkAction(googleFormUrl);
          if (!reachability.success) {
            console.warn("Google Form Link reachability check failed:", reachability.error);
          }
          
          let fieldMap: Record<string, string> = {};
          if (googleFormFields) {
            fieldMap = typeof googleFormFields === "string" ? JSON.parse(googleFormFields) : googleFormFields;
          }
          
          const googleFormData = new URLSearchParams();
          if (fieldMap.name) googleFormData.append(fieldMap.name, form.name);
          if (fieldMap.phone) googleFormData.append(fieldMap.phone, form.phone);
          if (fieldMap.birthday && form.birthday) {
            googleFormData.append(fieldMap.birthday, form.birthday);
            if (form.birthday.includes("-")) {
              const parts = form.birthday.split("-");
              if (parts.length === 3) {
                googleFormData.append(`${fieldMap.birthday}_year`, parts[0]);
                googleFormData.append(`${fieldMap.birthday}_month`, parts[1]);
                googleFormData.append(`${fieldMap.birthday}_day`, parts[2]);
              }
            }
          }
          if (fieldMap.anniversary && form.anniversary) {
            googleFormData.append(fieldMap.anniversary, form.anniversary);
            if (form.anniversary.includes("-")) {
              const parts = form.anniversary.split("-");
              if (parts.length === 3) {
                googleFormData.append(`${fieldMap.anniversary}_year`, parts[0]);
                googleFormData.append(`${fieldMap.anniversary}_month`, parts[1]);
                googleFormData.append(`${fieldMap.anniversary}_day`, parts[2]);
              }
            }
          }

          await fetch(googleFormUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: googleFormData.toString()
          });
          submittedToGoogle = true;
        } catch (gErr) {
          console.error("Error submitting to Google Form:", gErr);
        }
      }

      setSubmitted(true);

      // 3. Fallback to WhatsApp if not business plan / no Google Form URL set
      if (!googleFormUrl) {
        const msg = `Hello! Here are my customer details:\nName: ${form.name}\nPhone: ${form.phone}${form.birthday ? `\nBirthday: ${form.birthday}` : ''}${form.anniversary ? `\nAnniversary: ${form.anniversary}` : ''}`;
        const cleanPhone = whatsappNumber.replace(/\+/g, "").replace(/\s+/g, "");
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        if (typeof window !== "undefined" && typeof window.open === "function") {
          window.open(whatsappUrl, "_blank");
        }
      }
    } catch (err: any) {
      alert("Failed to submit details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ animation: "slideInUp 0.35s var(--ease-out)" }}>
        <div className="bottom-sheet-handle" />
        {!submitted ? (
          <>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", marginBottom: "6px" }}>
              Send Customer Details
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>to {cardName}</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label htmlFor="details-name" className="input-label">Your Name</label>
                <input id="details-name" className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label htmlFor="details-phone" className="input-label">Phone Number</label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-elevated)",
                  border: phoneFocused ? "1px solid var(--gold)" : "1px solid var(--bg-border)",
                  boxShadow: phoneFocused ? "0 0 0 1px var(--gold)" : "none",
                  borderRadius: "var(--radius-md)",
                  width: "100%",
                  height: "42px",
                  overflow: "visible",
                  position: "relative",
                  transition: "all 0.2s ease",
                  zIndex: 20
                }}>
                  <CountryCodeSelect value={phoneCode} onChange={val => updatePhone(val, phoneNational)} />
                  <div style={{ width: "1px", height: "20px", background: "var(--bg-border)", flexShrink: 0 }} />
                  <input
                    id="details-phone"
                    className="input-field"
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNational}
                    onChange={e => updatePhone(phoneCode, e.target.value)}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    style={{
                      flex: 1,
                      height: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "0 12px",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      fontFamily: "Outfit, sans-serif",
                      outline: "none",
                      boxShadow: "none"
                    }}
                    required
                  />
                </div>
              </div>

              {/* Optional: Birthday & Anniversary */}
              {(showBirthday || showAnniversary) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {showBirthday ? (
                    <div>
                      <label htmlFor="details-birthday" className="input-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Birthday <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input id="details-birthday" className="input-field" type="date" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} />
                    </div>
                  ) : <div />}
                  {showAnniversary ? (
                    <div>
                      <label htmlFor="details-anniversary" className="input-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Anniversary <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input id="details-anniversary" className="input-field" type="date" value={form.anniversary} onChange={e => setForm({...form, anniversary: e.target.value})} />
                    </div>
                  ) : <div />}
                </div>
              )}
              
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }} disabled={submitting}>
                {submitting ? "Submitting..." : "Send Details"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", marginBottom: "8px" }}>
              Details Sent!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
              {googleFormUrl && userPlan === "business" 
                ? "Your details have been successfully synced to Google Sheets. Thank you!"
                : "Your details have been successfully logged and sent on WhatsApp. Thank you!"}
            </p>
            <button onClick={onClose} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
