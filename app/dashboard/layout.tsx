"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { getCurrentUserAction, signOutAction } from "@/app/card/actions";
import { forceRedirect, forceLogout } from "@/lib/auth-utils";


const NAV_ITEMS = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "🃏", label: "My Cards", href: "/dashboard/cards" },
  { icon: "📊", label: "Analytics", href: "/dashboard/analytics" },
  { icon: "⭐", label: "Reviews", href: "/dashboard/reviews" },
  { icon: "📅", label: "Appointments", href: "/dashboard/bookings" },
  { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
];

interface UserSession {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: string;
  expiresAt: string | null;
  cardsCount: number;
  daysLeft?: number;
  isAdmin?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Google OAuth session bridge:
    // If the URL contains ?login=success, populate tab sessionStorage and clean up URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "success") {
        sessionStorage.setItem("cv_session_active", "true");
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", cleanUrl);
      }
    }

    async function checkSession() {
      try {
        if (typeof window !== "undefined") {
          const tabSession = sessionStorage.getItem("cv_session_active");
          if (tabSession !== "true") {
            forceRedirect("/sign-in");
            return;
          }
        }
        const u = await getCurrentUserAction();
        if (!u || u.planExpired) {
          await forceLogout(u?.planExpired ? "/sign-in?error=expired" : "/sign-in");
          return;
        }
        let daysLeft: number | undefined = undefined;
        if (u.expiresAt) {
          const diff = new Date(u.expiresAt).getTime() - Date.now();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          daysLeft = days > 0 ? days : 0;
        }
        setUser({ ...u, daysLeft });
      } catch (err) {
        console.error("Session verification failed:", err);
        forceRedirect("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    // Re-check auth whenever the user returns to this tab or presses Back.
    // This prevents seeing the dashboard after logout via browser Back button.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    // pageshow fires when the page is restored from bfcache (Back button)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from back-forward cache — force full reload
        // so server middleware cache headers take effect
        window.location.reload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);

    // 2. Inactivity monitoring (10 minutes = 600,000 ms)
    let lastActive = Date.now();
    localStorage.setItem("cv_last_activity", lastActive.toString());

    const updateActivity = () => {
      lastActive = Date.now();
      localStorage.setItem("cv_last_activity", lastActive.toString());
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, updateActivity, { passive: true });
    });

    const inactivityInterval = setInterval(async () => {
      const storedLastActive = localStorage.getItem("cv_last_activity");
      const parsedLastActive = storedLastActive ? parseInt(storedLastActive, 10) : lastActive;
      const inactiveMs = Date.now() - parsedLastActive;
      
      if (inactiveMs >= 600000) { // 10 minutes
        clearInterval(inactivityInterval);
        
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem("cv_redirect_after_login", currentPath);
        }
        
        sessionStorage.removeItem("cv_session_active");
        await forceLogout();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, updateActivity);
      });
      clearInterval(inactivityInterval);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await forceLogout();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: "240px",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--bg-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--bg-border)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)" }}>Card</span>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--gold)" }}>Vault</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "12px" }}>
          {NAV_ITEMS.map(item => {
            const isLocked = item.href === "/dashboard/bookings" && user?.plan === "free";
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 500,
                  marginBottom: "4px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isLocked && <span style={{ fontSize: "11px", color: "var(--gold)", opacity: 0.7 }} title="Locked on Free plan">🔒</span>}
              </Link>
            );
          })}


          {/* Create Card Button */}
          <div style={{ padding: "12px 0", marginTop: "12px", borderTop: "1px solid var(--bg-border)" }}>
            <Link
              href="/dashboard/create"
              className="btn-primary"
              style={{ display: "flex", justifyContent: "center", width: "100%" }}
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
                  router.push("/dashboard/billing");
                }
              }}
            >
              + Create New Card
            </Link>
          </div>
        </nav>

        {/* User profile details & Logout */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--bg-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--gold-glow)", border: "1px solid rgba(212,168,67,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", overflow: "hidden" }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                {user?.email || ""}
              </div>
              <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 600, textTransform: "capitalize", display: "flex", flexDirection: "column", gap: "1px" }}>
                <span>{user?.plan || "free"} Plan</span>
                {user?.daysLeft !== undefined && (
                  <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "9px" }}>{user.daysLeft} days left</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "6px 12px",
              background: "transparent",
              border: "1px solid rgba(244,63,94,0.2)",
              borderRadius: "var(--radius-md)",
              color: "var(--error)",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(244,63,94,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: "240px", flex: 1, minWidth: 0, padding: "0 0 80px" }}>
        {/* Top bar */}
        <div style={{
          background: "rgba(8,8,8,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--bg-border)",
          padding: "16px 32px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Welcome back, <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{user?.name || "User"}</span> 👋
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {user?.plan === "free" && (
              <Link href="/dashboard/billing" style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--gold-glow)",
                border: "1px solid rgba(212,168,67,0.3)",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                textDecoration: "none",
                fontSize: "12px",
                color: "var(--gold)",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}>
                ⭐ Upgrade to Pro
              </Link>
            )}
            {user?.plan === "pro" && (
              <Link href="/dashboard/billing" style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                textDecoration: "none",
                fontSize: "12px",
                color: "#A78BFA",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}>
                💎 Upgrade to Business
              </Link>
            )}
            {user?.plan === "business" && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                fontSize: "12px",
                color: "#34D399",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
              }}>
                ✓ Business Plan
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: "32px" }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--bg-card)",
        borderTop: "1px solid var(--bg-border)",
        display: "none",
        justifyContent: "space-around",
        padding: "10px 0",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        zIndex: 100,
      }} id="mobile-bottom-nav">
        {NAV_ITEMS.slice(0, 4).map(item => (
          <Link key={item.href} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none" }}>
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "Outfit, sans-serif" }}>{item.label}</span>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          main { margin-left: 0 !important; }
          #mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
