"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUserAction, updateUserProfileAction, deleteUserAccountAction } from "@/app/card/actions";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  avatarUrl?: string;
  expiresAt?: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [daysLeft, setDaysLeft] = useState<number | null>(null);


  useEffect(() => {
    async function loadProfileAndCards() {
      try {
        setLoading(true);
        const user = await getCurrentUserAction();
        if (user) {
          setProfile({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            avatarUrl: user.avatarUrl,
            expiresAt: user.expiresAt,
          });
          setName(user.name);
          if (user.plan !== "free" && user.expiresAt) {
            const diff = new Date(user.expiresAt).getTime() - Date.now();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setDaysLeft(days > 0 ? days : 0);
          } else {
            setDaysLeft(null);
          }


        }
      } catch (err) {
        console.error("Failed to load settings profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileAndCards();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg("Name cannot be empty");
    
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updateUserProfileAction(name.trim());
      if (res.success) {
        setSuccessMsg("Profile settings updated successfully!");
        setProfile(prev => prev ? { ...prev, name: res.user.name || "" } : null);
        router.refresh();
      }
    } catch (err) {
      setErrorMsg("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const doubleCheck = confirm(
      "WARNING: Are you absolutely sure you want to delete your CardVault account? " +
      "This will permanently delete all your digital business cards, review histories, catalog products, and analytics. This action cannot be undone."
    );
    if (!doubleCheck) return;

    try {
      const res = await deleteUserAccountAction();
      if (res.success) {
        alert("Your account has been deleted. Redirecting to home...");
        router.push("/");
      }
    } catch (err) {
      alert("Failed to delete account. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--bg-border)", borderTop: "3px solid var(--gold)", borderRadius: "50%", animation: "spin360 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "14px", color: "var(--text-secondary)" }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  const plan = profile?.plan || "free";
  const isProOrBusiness = plan === "pro" || plan === "business";
  const isBusiness = plan === "business";

  // Plan badge color
  const planColor = isBusiness ? "#34D399" : plan === "pro" ? "#A78BFA" : "var(--gold)";
  const planBg = isBusiness ? "rgba(52,211,153,0.12)" : plan === "pro" ? "rgba(167,139,250,0.12)" : "var(--gold-glow)";
  const planBorder = isBusiness ? "rgba(52,211,153,0.3)" : plan === "pro" ? "rgba(167,139,250,0.3)" : "rgba(212,168,67,0.3)";

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Dashboard</Link>
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "8px" }}>Settings</h1>
      </div>

      {successMsg && (
        <div style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34D399", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", fontFamily: "Outfit, sans-serif" }}>
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", color: "var(--error)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", fontFamily: "Outfit, sans-serif" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "620px" }}>
        {/* Profile */}
        <form onSubmit={handleSave} className="card">
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
            👤 Profile Settings
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Avatar Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--bg-border)" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--gold-glow)", border: "2px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", overflow: "hidden", flexShrink: 0 }}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "👤"
                )}
              </div>
              <div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>{profile?.name || name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {profile?.id.startsWith("google-") || profile?.avatarUrl ? "Signed in with Google" : "Signed in with Email"}
                </div>
              </div>
            </div>
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <input className="input-field" value={profile?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Email address cannot be changed</p>
            </div>
            <div>
              <label className="input-label">Subscription Plan</label>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                <span style={{ background: planBg, border: `1px solid ${planBorder}`, borderRadius: "var(--radius-md)", padding: "4px 12px", fontSize: "12px", color: planColor, fontFamily: "Outfit, sans-serif", fontWeight: 600, textTransform: "uppercase" }}>
                  {plan}
                </span>
                {daysLeft !== null && (
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "Outfit, sans-serif" }}>
                    ({daysLeft} days remaining)
                  </span>
                )}
                {plan === "free" && (
                  <Link href="/dashboard/billing" style={{ fontSize: "12px", color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
                    Upgrade to Pro →
                  </Link>
                )}
                {plan === "pro" && (
                  <Link href="/dashboard/billing" style={{ fontSize: "12px", color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
                    Upgrade to Business →
                  </Link>
                )}
                {isBusiness && (
                  <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 600 }}>✓ Highest Plan</span>
                )}
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: "10px" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Notifications */}
        <div className="card">
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px" }}>
            🔔 Notifications
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Email on new review", desc: "Get emailed when a customer writes a review", checked: true, locked: false },
              { label: "Weekly analytics report", desc: "Summary of card views and clicks every Monday", checked: true, locked: false },
              { 
                label: "WhatsApp review alerts", 
                desc: isProOrBusiness ? "Get notified on WhatsApp when a customer writes a review" : "Pro/Business feature — upgrade to enable", 
                checked: isProOrBusiness, 
                locked: !isProOrBusiness,
              },
              { label: "Marketing emails", desc: "Tips and updates from CardVault", checked: false, locked: false },
            ].map(n => (
              <div key={n.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", opacity: n.locked ? 0.5 : 1 }}>
                <div>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", marginBottom: "3px" }}>
                    {n.label} {n.locked && <span style={{ fontSize: "10px", color: "var(--gold)", background: "var(--gold-glow)", padding: "1px 6px", borderRadius: "999px", marginLeft: "4px" }}>Pro+</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{n.desc}</div>
                </div>
                <div style={{ width: "40px", height: "22px", borderRadius: "11px", background: n.checked ? "var(--gold)" : "var(--bg-border)", position: "relative", cursor: n.locked ? "not-allowed" : "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: n.checked ? "21px" : "3px", transition: "left 0.2s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Features Overview - For Free users */}
        {plan === "free" && (
          <div className="card" style={{ border: "1px solid rgba(212,168,67,0.3)", background: "linear-gradient(135deg, rgba(212,168,67,0.03), var(--bg-card))" }}>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text-primary)", marginBottom: "12px" }}>
              ⭐ Unlock More Features
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              You are on the <strong style={{ color: "var(--gold)" }}>Free plan</strong>. Upgrade to Pro or Business to unlock premium features:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {["5 business cards", "All 8 themes", "Unlimited AI reviews", "Product catalog", "Appointment booking", "Custom URL slug", "Full analytics", "No branding"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--gold)", fontSize: "10px" }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Link href="/dashboard/billing" className="btn-primary" style={{ justifyContent: "center", textDecoration: "none" }}>
              View Plans & Upgrade →
            </Link>
          </div>
        )}



        {/* Danger Zone */}
        <div className="card" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--error)", marginBottom: "16px" }}>
            ⚠️ Danger Zone
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Deleting your account will permanently remove all your cards, reviews, and analytics data from our servers.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: "10px 20px",
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.3)",
              borderRadius: "var(--radius-full)",
              color: "var(--error)",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
          >
            Delete Account
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
