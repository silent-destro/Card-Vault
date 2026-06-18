"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentAdminAction,
  adminLogoutAction,
  adminGetUsersAction,
  adminCreateUserAction,
  adminExtendPlanAction,
  adminDeleteUserAction,
  adminUpdateUserPlanAction
} from "@/app/card/actions";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";

interface Card {
  id: string;
  slug: string;
  businessName: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  plan: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  cards: Card[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ email: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New States for enhanced admin actions
  const [viewingUserCards, setViewingUserCards] = useState<User | null>(null);
  const [managingUserPlan, setManagingUserPlan] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [customValidityDays, setCustomValidityDays] = useState<string>("30");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [origin, setOrigin] = useState("https://cardvault.in");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro" | "business" | "expired">("all");

  // Form states for creating client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNo, setPhoneNo] = useState("");
  const [clientPlan, setClientPlan] = useState("free");

  const getInitialExpiry = () => {
    const targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [clientExpiry, setClientExpiry] = useState(getInitialExpiry());
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [tempPassResult, setTempPassResult] = useState("");

  // Plan extension state
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const loadUsersData = async () => {
    try {
      const res = await adminGetUsersAction();
      if (res.success && res.users) {
        setUsers(res.users as any);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      if (typeof window !== "undefined") {
        const tabSession = sessionStorage.getItem("cv_admin_session_active");
        if (tabSession !== "true") {
          await adminLogoutAction();
          router.push("/admin");
          return;
        }
      }
      const currentAdmin = await getCurrentAdminAction();
      if (!currentAdmin) {
        router.push("/admin");
        return;
      }
      setAdmin(currentAdmin);
      await loadUsersData();
      setLoading(false);
    }
    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("cv_admin_session_active");
      } catch (e) {}
    }
    await adminLogoutAction();
    router.push("/admin");
  };

  const handlePlanChange = (planVal: string) => {
    setClientPlan(planVal);
    let days = 2;
    if (planVal === "free") days = 2;
    else if (planVal === "pro-monthly" || planVal === "business-monthly") days = 30;
    else if (planVal === "pro-yearly" || planVal === "business-yearly") days = 365;

    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    setClientExpiry(`${yyyy}-${mm}-${dd}`);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !phoneNo) {
      setErrorMsg("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    setTempPassResult("");

    const fullPhone = `${countryCode}${phoneNo}`;

    try {
      const res = await adminCreateUserAction({
        name: clientName,
        email: clientEmail,
        phone: fullPhone,
        plan: clientPlan,
        expiresAt: clientExpiry || null
      });

      if (res.success && res.user) {
        setSuccessMsg(`Account for '${clientName}' registered successfully!`);
        setTempPassResult(res.tempPassword || "");

        setClientName("");
        setClientEmail("");
        setPhoneNo("");
        setClientPlan("free");
        setClientExpiry(getInitialExpiry());

        await loadUsersData();
      } else {
        setErrorMsg(res.error || "Failed to register client.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during user creation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtendPlan = async (userId: string, days: number) => {
    setExtendingId(userId);
    try {
      const res = await adminExtendPlanAction(userId, days);
      if (res.success) {
        await loadUsersData();
      } else {
        alert(res.error || "Failed to extend plan.");
      }
    } catch (err) {
      alert("Error occurred while extending plan.");
    } finally {
      setExtendingId(null);
    }
  };

  const handleDeleteCustomer = async (userId: string, email: string) => {
    if (!confirm(`⚠️ WARNING: Permanently delete '${email}'?\n\nThis will purge their account, cards, analytics, catalog items, reviews, and appointments.\n\nThis CANNOT be undone.`)) return;
    setLoading(true);
    try {
      const res = await adminDeleteUserAction(userId);
      if (res.success) {
        await loadUsersData();
      } else {
        alert(res.error || "Failed to delete customer.");
      }
    } catch (err) {
      alert("An unexpected error occurred while trying to delete customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomerPlan = async (userId: string, planVal: string) => {
    const planLabel = planVal === "free" ? "Free Trial" : planVal === "pro" ? "Pro Monthly" : planVal === "pro-yearly" ? "Pro Yearly" : planVal === "business" ? "Business Monthly" : "Business Yearly";
    if (!confirm(`Change this customer's plan to ${planLabel}? This will update their plan tier and reset their expiration date.`)) return;
    setLoading(true);
    try {
      const res = await adminUpdateUserPlanAction(userId, planVal);
      if (!res.success) {
        alert(res.error || "Failed to update plan.");
      }
      await loadUsersData();
    } catch (err) {
      alert("An unexpected error occurred while trying to update plan.");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (expiryStr: string | null) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  const getDaysRemaining = (expiryStr: string | null): string => {
    if (!expiryStr) return "Never";
    const now = new Date();
    const expiry = new Date(expiryStr);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `Expired ${Math.abs(diff)}d ago`;
    if (diff === 0) return "Expires today";
    return `${diff} days left`;
  };

  const getDaysRemainingNum = (expiryStr: string | null): number => {
    if (!expiryStr) return -1; // no expiry = -1 sentinel
    const now = new Date();
    const expiry = new Date(expiryStr);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPlanTotalDays = (user: User): number => {
    if (user.plan === "free") return 2;
    if (!user.expiresAt) return 30;
    const expiry = new Date(user.expiresAt);
    const created = new Date(user.createdAt);
    const diffDays = Math.ceil(Math.abs(expiry.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 300 ? 365 : 30;
  };

  const getValidityBadgeStyle = (daysLeft: number, noExpiry: boolean) => {
    if (noExpiry) return { color: "var(--gold)", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.35)", barColor: "var(--gold)" };
    if (daysLeft < 0) return { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", barColor: "#EF4444" };
    if (daysLeft <= 3) return { color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)", barColor: "#F97316" };
    if (daysLeft <= 7) return { color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)", barColor: "#FBBF24" };
    return { color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.35)", barColor: "#34D399" };
  };

  const getPlanOptionValue = (user: User) => {
    if (user.plan === "free") return "free";
    if (!user.expiresAt) return user.plan;
    const expiry = new Date(user.expiresAt);
    const created = new Date(user.createdAt);
    const diffDays = Math.ceil(Math.abs(expiry.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 300 ? `${user.plan}-yearly` : user.plan;
  };

  const getPlanLabel = (user: User) => {
    if (user.plan === "free") return "Free Trial";
    if (!user.expiresAt) return user.plan.toUpperCase();
    const expiry = new Date(user.expiresAt);
    const created = new Date(user.createdAt);
    const diffDays = Math.ceil(Math.abs(expiry.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 300 ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Yearly` : `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Monthly`;
  };

  const getPlanColor = (plan: string) => {
    if (plan === "business") return { color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" };
    if (plan === "pro") return { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" };
    return { color: "var(--gold)", bg: "var(--gold-glow)", border: "rgba(212,175,55,0.25)" };
  };

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => !isExpired(u.expiresAt)).length;
    const expired = users.filter(u => isExpired(u.expiresAt)).length;
    const freePlan = users.filter(u => u.plan === "free").length;
    const proPlan = users.filter(u => u.plan === "pro").length;
    const bizPlan = users.filter(u => u.plan === "business").length;
    return { total, active, expired, freePlan, proPlan, bizPlan };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = users;
    if (planFilter === "free") list = list.filter(u => u.plan === "free");
    else if (planFilter === "pro") list = list.filter(u => u.plan === "pro");
    else if (planFilter === "business") list = list.filter(u => u.plan === "business");
    else if (planFilter === "expired") list = list.filter(u => isExpired(u.expiresAt));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(u =>
        (u.name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || "").includes(q) ||
        u.cards.some(c => c.slug.toLowerCase().includes(q))
      );
    }
    return list;
  }, [users, planFilter, searchQuery]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading Admin Control Panel...</p>
        </div>
        <style>{`@keyframes spin360 { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}>
      <style>{`
        @keyframes spin360 { to { transform: rotate(360deg); } }
        
        .admin-sticky-card {
          background: rgba(20, 20, 20, 0.65);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-xl);
          padding: 28px;
          position: sticky;
          top: 90px;
        }

        .admin-modal-content {
          background: rgba(20, 20, 20, 0.9);
          border: 1px solid rgba(212, 168, 67, 0.25);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 460px;
          padding: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          animation: scaleIn 0.2s ease-out;
        }

        .filter-tab { cursor: pointer; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid var(--bg-border); background: transparent; color: var(--text-muted); font-family: Outfit, sans-serif; transition: all 0.2s; }
        .filter-tab:hover { border-color: var(--gold); color: var(--gold); }
        .filter-tab.active { background: var(--gold); color: #080808; border-color: var(--gold); }
        .extend-btn { padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: Outfit, sans-serif; }
        .plan-select { padding: 5px 8px; background: var(--bg-elevated); border: 1px solid var(--bg-border); border-radius: 6px; color: var(--text-primary); font-size: 11px; font-family: Outfit, sans-serif; cursor: pointer; transition: all 0.2s; }
        .plan-select:hover { border-color: var(--gold); }

        @media (max-width: 1200px) {
          .admin-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }

        @media (max-width: 1024px) {
          .admin-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .admin-sticky-card { position: static !important; padding: 20px !important; }
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 12px 16px !important;
            flex-direction: column !important;
            gap: 12px !important;
            align-items: stretch !important;
            text-align: center !important;
          }
          .admin-header-left {
            justify-content: center !important;
          }
          .admin-header-right {
            flex-direction: column !important;
            gap: 8px !important;
            align-items: center !important;
          }
          .admin-main {
            padding: 16px !important;
          }
        }

        @media (max-width: 640px) {
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-user-bottom { flex-direction: column !important; align-items: flex-start !important; }
          .admin-card-right-badge { display: none !important; }
          .mobile-delete-btn { display: inline-flex !important; }
          .admin-card-actions {
            width: 100% !important;
            display: flex !important;
            gap: 8px !important;
          }
          .admin-card-actions > button {
            flex: 1 !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 480px) {
          .admin-modal-content {
            padding: 20px !important;
          }
          .admin-modal-card-item {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .admin-modal-card-item > div:first-child {
            margin-right: 0 !important;
          }
          .admin-modal-card-item > div:last-child {
            justify-content: flex-end !important;
          }
        }

        @media (max-width: 400px) {
          .admin-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top Navbar */}
      <header className="admin-header" style={{
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div className="admin-header-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🛡️</span>
          <span style={{ fontWeight: 700, fontSize: "18px" }}>CardVault Control Center</span>
          <span style={{ fontSize: "10px", color: "#A78BFA", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "4px", padding: "1px 6px", fontWeight: 600 }}>SYSTEM ADMIN</span>
        </div>

        <div className="admin-header-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Logged in: <strong style={{ color: "var(--gold)" }}>{admin?.email}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 14px",
              background: "rgba(244,63,94,0.15)",
              border: "1px solid rgba(244,63,94,0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--error)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "Outfit, sans-serif"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.15)"}
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="admin-main" style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Stats Row */}
        <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {[
            { label: "Total Clients", value: stats.total, color: "var(--text-primary)", icon: "👥" },
            { label: "Active", value: stats.active, color: "#34D399", icon: "✅" },
            { label: "Expired", value: stats.expired, color: "#EF4444", icon: "⏰" },
            { label: "Free Plan", value: stats.freePlan, color: "var(--gold)", icon: "🆓" },
            { label: "Pro Plan", value: stats.proPlan, color: "#A78BFA", icon: "⭐" },
            { label: "Business", value: stats.bizPlan, color: "#34D399", icon: "🏢" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{stat.icon}</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "32px" }}>

          {/* Left Column: Client Directory */}
          <div>
            {/* Search + Filter Header */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                  👥 Registered Customer Accounts
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "4px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-border)" }}>
                  Showing: <strong style={{ color: "var(--text-primary)" }}>{filteredUsers.length}</strong> / {users.length}
                </span>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                className="input-field"
                placeholder="🔍  Search by name, email, phone or card slug..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ marginBottom: "12px", width: "100%" }}
              />

              {/* Plan Filter Tabs */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["all", "free", "pro", "business", "expired"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`filter-tab ${planFilter === tab ? "active" : ""}`}
                    onClick={() => setPlanFilter(tab)}
                  >
                    {tab === "all" ? "All Plans" : tab === "expired" ? "⏰ Expired" : tab === "free" ? "🆓 Free" : tab === "pro" ? "⭐ Pro" : "🏢 Business"}
                  </button>
                ))}
              </div>
            </div>

            {/* User Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--bg-border)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    {searchQuery || planFilter !== "all" ? "No clients match your search or filter." : "No clients registered yet."}
                  </p>
                </div>
              ) : (
                filteredUsers.map(u => {
                  const planStyle = getPlanColor(u.plan);
                  const expired = isExpired(u.expiresAt);
                  const card = u.cards[0];
                  const isExtending = extendingId === u.id;

                  const daysLeft = getDaysRemainingNum(u.expiresAt);
                  const noExpiry = !u.expiresAt;
                  const vBadge = getValidityBadgeStyle(daysLeft, noExpiry);
                  const totalDays = getPlanTotalDays(u);
                  const progressPct = noExpiry ? 100 : daysLeft < 0 ? 0 : Math.min(100, Math.round((daysLeft / totalDays) * 100));

                  return (
                    <div key={u.id} style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${expired ? "rgba(239,68,68,0.25)" : "var(--bg-border)"}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "20px",
                      transition: "border-color 0.2s"
                    }}>
                      {/* Top row: identity + plan badge + validity badge + delete */}
                      <div className="admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {u.name || "Unnamed Client"}
                            </span>
                            <span style={{
                              fontSize: "10px",
                              background: planStyle.bg,
                              color: planStyle.color,
                              border: `1px solid ${planStyle.border}`,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              fontWeight: 700,
                              textTransform: "uppercase"
                            }}>
                              {getPlanLabel(u)}
                            </span>
                            {expired ? (
                              <span style={{ fontSize: "10px", background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "1px 8px", borderRadius: "999px", fontWeight: 600 }}>EXPIRED</span>
                            ) : (
                              <span style={{ fontSize: "10px", background: "rgba(34,197,94,0.12)", color: "#34D399", border: "1px solid rgba(34,197,94,0.25)", padding: "1px 8px", borderRadius: "999px", fontWeight: 600 }}>ACTIVE</span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span>📧 <strong style={{ color: "var(--text-secondary)" }}>{u.email}</strong></span>
                            {u.phone && <span>📱 <strong style={{ color: "var(--text-secondary)" }}>{u.phone}</strong></span>}

                            {/* Days Remaining — inline below email */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                              <span style={{
                                background: vBadge.bg,
                                border: `1px solid ${vBadge.border}`,
                                borderRadius: "6px",
                                padding: "3px 10px",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: vBadge.color,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px"
                              }}>
                                ⏱ {noExpiry ? "∞ No Expiry" : daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : daysLeft === 0 ? "Expires today" : `${daysLeft} days remaining`}
                              </span>
                              {/* Mini progress bar */}
                              {!noExpiry && (
                                <div style={{ flex: 1, maxWidth: "80px" }}>
                                  <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${progressPct}%`, background: vBadge.barColor, borderRadius: "999px", transition: "width 0.6s ease" }} />
                                  </div>
                                </div>
                              )}
                            </div>

                            <span style={{ marginTop: "4px" }}>
                              <span style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "4px", padding: "2px 7px", color: "var(--gold-light)", fontSize: "11px", display: "inline-block" }}>
                                👤 Added by: <strong>{u.createdBy || "System"}</strong>
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Days Remaining Badge — always visible, top-right */}
                        <div className="admin-card-right-badge" style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                          marginLeft: "14px",
                          flexShrink: 0
                        }}>
                          {/* Countdown pill */}
                          <div style={{
                            background: vBadge.bg,
                            border: `1px solid ${vBadge.border}`,
                            borderRadius: "10px",
                            padding: "8px 14px",
                            textAlign: "center",
                            minWidth: "96px"
                          }}>
                            <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "2px" }}>⏱ Days Left</div>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: vBadge.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                              {noExpiry ? "∞" : daysLeft < 0 ? "0" : daysLeft}
                            </div>
                            <div style={{ fontSize: "9px", color: vBadge.color, marginTop: "2px", fontWeight: 600 }}>
                              {noExpiry ? "No Expiry" : daysLeft < 0 ? `Exp. ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? "Expires today" : "remaining"}
                            </div>
                          </div>
                          {/* Progress bar */}
                          {!noExpiry && (
                            <div style={{ width: "96px" }}>
                              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%",
                                  width: `${progressPct}%`,
                                  background: vBadge.barColor,
                                  borderRadius: "999px",
                                  transition: "width 0.6s ease"
                                }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", fontSize: "9px", color: "var(--text-muted)" }}>
                                <span>0</span>
                                <span style={{ color: vBadge.color, fontWeight: 600 }}>{progressPct}%</span>
                                <span>{totalDays}d</span>
                              </div>
                            </div>
                          )}
                          {/* Delete button below badge */}
                          <button
                            onClick={() => handleDeleteCustomer(u.id, u.email)}
                            className="desktop-delete-btn"
                            style={{
                              padding: "4px 10px",
                              background: "rgba(244,63,94,0.08)",
                              border: "1px solid rgba(244,63,94,0.25)",
                              borderRadius: "6px",
                              color: "var(--error)",
                              fontSize: "10px",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontFamily: "Outfit, sans-serif",
                              width: "96px"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.18)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "12px" }} />

                      {/* Bottom row: info + actions */}
                      <div className="admin-user-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        {/* Meta info */}
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)" }}>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Expiry: </span>
                            <span style={{ color: expired ? "#EF4444" : "var(--text-primary)", fontWeight: 500 }}>
                              {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Never"}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Joined: </span>
                            <span>{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Cards: </span>
                            {u.cards.length > 0 ? (
                              <button
                                onClick={() => setViewingUserCards(u)}
                                style={{
                                  background: "rgba(212,168,67,0.12)",
                                  border: "1px solid rgba(212,168,67,0.3)",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  color: "var(--gold)",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  fontFamily: "Outfit, sans-serif",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.25)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(212,168,67,0.12)"}
                              >
                                {u.cards.length} {u.cards.length === 1 ? "Card" : "Cards"} 👁️
                              </button>
                            ) : (
                              <span style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid var(--bg-border)",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                color: "var(--text-muted)",
                                fontSize: "11px",
                                fontWeight: 500,
                                display: "inline-block"
                              }}>
                                0 Cards
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="admin-card-actions" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <button
                            onClick={() => handleDeleteCustomer(u.id, u.email)}
                            className="mobile-delete-btn"
                            style={{
                              display: "none",
                              padding: "9px 18px",
                              background: "rgba(244,63,94,0.08)",
                              border: "1px solid rgba(244,63,94,0.25)",
                              borderRadius: "var(--radius-md)",
                              color: "var(--error)",
                              fontSize: "12px",
                              cursor: "pointer",
                              fontWeight: 800,
                              fontFamily: "Outfit, sans-serif",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.18)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => {
                              setManagingUserPlan(u);
                              if (u.plan === "free") {
                                setSelectedPlan("free");
                                setCustomValidityDays("2");
                              } else if (u.plan === "pro") {
                                setSelectedPlan("pro-monthly");
                                setCustomValidityDays("30");
                              } else if (u.plan === "business") {
                                setSelectedPlan("business-monthly");
                                setCustomValidityDays("30");
                              } else {
                                setSelectedPlan("free");
                                setCustomValidityDays("2");
                              }
                            }}
                            style={{
                              padding: "9px 18px",
                              fontSize: "12px",
                              fontWeight: 800,
                              fontFamily: "Outfit, sans-serif",
                              background: "linear-gradient(135deg, #FFE294 0%, #D4AF37 50%, #B59023 100%)",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              color: "#080808",
                              borderRadius: "var(--radius-md)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 0 15px rgba(212, 175, 55, 0.25)",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                              e.currentTarget.style.boxShadow = "0 0 25px rgba(212, 175, 55, 0.55), 0 4px 12px rgba(0, 0, 0, 0.3)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = "translateY(0) scale(1)";
                              e.currentTarget.style.boxShadow = "0 0 15px rgba(212, 175, 55, 0.25)";
                            }}
                          >
                            💎 Upgrade & Expiry
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Register Client Form */}
          <div>
            <div className="admin-sticky-card">
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                🆕 Register Customer
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
                Adding as: <strong style={{ color: "var(--gold)" }}>{admin?.email}</strong>
              </p>

              {successMsg && (
                <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34D399", borderRadius: "var(--radius-md)", padding: "14px", fontSize: "13px", marginBottom: "20px" }}>
                  <p style={{ margin: "0 0 8px" }}>✅ {successMsg}</p>
                  {tempPassResult && (
                    <div style={{ background: "rgba(8,8,8,0.5)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "6px", padding: "10px", marginTop: "10px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Generated Password</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "15px", color: "var(--text-primary)", fontWeight: "bold" }}>{tempPassResult}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(tempPassResult); }}
                          style={{ fontSize: "11px", background: "var(--gold)", color: "#000", border: "none", padding: "3px 8px", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "var(--error)", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "13px", marginBottom: "20px" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateClient} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="input-label">Customer Name</label>
                  <input className="input-field" type="text" placeholder="e.g. Patel Electronics" value={clientName} onChange={e => setClientName(e.target.value)} required />
                </div>

                <div>
                  <label className="input-label">Email Address</label>
                  <input className="input-field" type="email" placeholder="client@gmail.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required />
                </div>

                <div>
                  <label className="input-label">Mobile Number</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="98765 43210"
                      value={phoneNo}
                      onChange={e => setPhoneNo(e.target.value.replace(/\D/g, ""))}
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Phone number (without country code) becomes their password.
                  </p>
                </div>

                <div>
                  <label className="input-label">Subscription Plan</label>
                  <select
                    className="input-field"
                    value={clientPlan}
                    onChange={e => handlePlanChange(e.target.value)}
                    style={{ background: "var(--bg-elevated)", cursor: "pointer" }}
                  >
                    <option value="free">Free Trial (2 Days)</option>
                    <option value="pro-monthly">Pro Monthly (30 Days)</option>
                    <option value="pro-yearly">Pro Yearly (365 Days)</option>
                    <option value="business-monthly">Business Monthly (30 Days)</option>
                    <option value="business-yearly">Business Yearly (365 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Expiry Date</label>
                  <input className="input-field" type="date" value={clientExpiry} onChange={e => setClientExpiry(e.target.value)} style={{ colorScheme: "dark" }} />
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Auto-set: 2d Free · 30d Monthly · 365d Yearly
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "8px", textDecoration: "none" }}
                >
                  {submitting ? "Creating..." : "✓ Register Customer"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* VIEW USER CARDS MODAL */}
      {viewingUserCards && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }} onClick={() => setViewingUserCards(null)}>
          <div style={{
            background: "rgba(20, 20, 20, 0.9)",
            border: "1px solid rgba(212, 168, 67, 0.25)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "500px",
            padding: "28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            animation: "scaleIn 0.2s ease-out"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)" }}>
                  Cards Created
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Client: {viewingUserCards.name || viewingUserCards.email}
                </p>
              </div>
              <button
                onClick={() => setViewingUserCards(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
              {viewingUserCards.cards.map(card => (
                <div key={card.id} className="admin-modal-card-item" style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                    <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {card.businessName}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--gold)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {origin.replace(/^https?:\/\//, "")}/card/{card.slug}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={`${origin}/card/${card.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "11px", textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      Open ↗
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${origin}/card/${card.slug}`);
                        alert("Card link copied!");
                      }}
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "11px", whiteSpace: "nowrap" }}
                    >
                      Copy 📋
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewingUserCards(null)}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center", marginTop: "20px" }}
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* PLAN SETTINGS & UPGRADE MODAL */}
      {managingUserPlan && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }} onClick={() => setManagingUserPlan(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)" }}>
                  💎 Manage Subscription
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Client: {managingUserPlan.name || managingUserPlan.email}
                </p>
              </div>
              <button
                onClick={() => setManagingUserPlan(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Current Status */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                fontSize: "13px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Current Plan:</span>
                  <strong style={{ color: "var(--gold)", textTransform: "uppercase" }}>{managingUserPlan.plan}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Expiry Date:</span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {managingUserPlan.expiresAt
                      ? new Date(managingUserPlan.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Never (Unlimited)"}
                  </strong>
                </div>
              </div>

              {/* Plan Select */}
              <div>
                <label className="input-label">Select Subscription Plan</label>
                <select
                  className="input-field"
                  value={selectedPlan}
                  onChange={e => {
                    const plan = e.target.value;
                    setSelectedPlan(plan);
                    if (plan === "free") {
                      setCustomValidityDays("2");
                    } else if (plan === "pro-monthly" || plan === "business-monthly") {
                      setCustomValidityDays("30");
                    } else if (plan === "pro-yearly" || plan === "business-yearly") {
                      setCustomValidityDays("365");
                    }
                  }}
                  style={{ background: "var(--bg-elevated)", cursor: "pointer" }}
                >
                  <option value="free">Free Trial (1 Card · 2 Days)</option>
                  <option value="pro-monthly">Pro Monthly (2 Cards · 30 Days)</option>
                  <option value="pro-yearly">Pro Yearly (2 Cards · 365 Days)</option>
                  <option value="business-monthly">Business Monthly (4 Cards · 30 Days)</option>
                  <option value="business-yearly">Business Yearly (4 Cards · 365 Days)</option>
                </select>
              </div>

              {/* Custom Validity Input */}
              <div>
                <label className="input-label">Custom Day(s) of Validity</label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  max="3650"
                  placeholder="e.g. 30"
                  value={customValidityDays}
                  onChange={e => setCustomValidityDays(e.target.value)}
                />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Specify the number of days of validity to apply. Default is auto-filled but can be customized.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                <button
                  onClick={async () => {
                    const days = parseInt(customValidityDays);
                    if (isNaN(days) || days <= 0) {
                      alert("Please enter a valid number of days.");
                      return;
                    }
                    setIsUpdatingPlan(true);
                    try {
                      const res = await adminUpdateUserPlanAction(managingUserPlan.id, selectedPlan, days);
                      if (res.success) {
                        alert(`Successfully updated plan to ${selectedPlan.toUpperCase()} with ${days} days of validity!`);
                        setManagingUserPlan(null);
                        window.location.reload();
                      } else {
                        alert(res.error || "Failed to update plan.");
                      }
                    } catch (err) {
                      alert("An error occurred while updating user plan.");
                    } finally {
                      setIsUpdatingPlan(false);
                    }
                  }}
                  disabled={isUpdatingPlan}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
                >
                  {isUpdatingPlan ? "Processing..." : "✓ Update Plan & Set Expiry"}
                </button>

                <button
                  onClick={async () => {
                    const days = parseInt(customValidityDays);
                    if (isNaN(days) || days <= 0) {
                      alert("Please enter a valid number of days.");
                      return;
                    }
                    setIsUpdatingPlan(true);
                    try {
                      const res = await adminExtendPlanAction(managingUserPlan.id, days);
                      if (res.success) {
                        alert(`Successfully extended plan by ${days} days!`);
                        setManagingUserPlan(null);
                        window.location.reload();
                      } else {
                        alert(res.error || "Failed to extend plan.");
                      }
                    } catch (err) {
                      alert("An error occurred while extending plan.");
                    } finally {
                      setIsUpdatingPlan(false);
                    }
                  }}
                  disabled={isUpdatingPlan}
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399" }}
                >
                  {isUpdatingPlan ? "Processing..." : "➕ Extend Current Expiry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
