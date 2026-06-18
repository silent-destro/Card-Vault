export const dynamic = "force-dynamic";

import { getCurrentUserAction } from "@/app/card/actions";
import CardBuilder from "@/components/CardBuilder";
import Link from "next/link";

export default async function CreateCardPage() {
  const user = await getCurrentUserAction();
  
  if (user) {
    const limits: Record<string, number> = {
      free: 1,
      pro: 2,
      business: 4
    };
    const limit = limits[user.plan] || 1;
    
    if (user.cardsCount >= limit) {
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
              Plan Limit Reached
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7, marginBottom: "32px" }}>
              Your account is currently on the <strong style={{ color: "var(--gold)" }}>{user.plan.toUpperCase()}</strong> plan, which allows up to <strong>{limit}</strong> digital business card(s). You have already created <strong>{user.cardsCount}</strong> card(s).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
              <Link href="/dashboard/billing" className="btn-primary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
                💎 Upgrade Subscription Plan
              </Link>
              <Link href="/dashboard" className="btn-secondary" style={{ width: "100%", maxWidth: "320px", justifyContent: "center", textDecoration: "none" }}>
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }
  
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "12px", marginBottom: "4px" }}>
          Create Your Card
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Fill in your business details to create a stunning digital card.
        </p>
      </div>

      <CardBuilder userPlan={user?.plan || "free"} />
    </div>
  );
}
