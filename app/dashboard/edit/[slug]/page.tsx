export const dynamic = "force-dynamic";

import { getCurrentUserAction, getCardForEditAction } from "@/app/card/actions";
import CardBuilder from "@/components/CardBuilder";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditCardPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUserAction();

  if (!user) {
    redirect("/sign-in");
  }

  const cardData = await getCardForEditAction(slug);

  if (!cardData) {
    return (
      <div>
        <div style={{ marginBottom: "28px" }}>
          <Link href="/dashboard/cards" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← Back to My Cards
          </Link>
        </div>
        <div className="card" style={{ maxWidth: "520px", margin: "40px auto", textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)", marginBottom: "12px" }}>
            Card Not Found
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
            This card doesn&apos;t exist or you don&apos;t have permission to edit it.
          </p>
          <Link href="/dashboard/cards" className="btn-primary" style={{ justifyContent: "center", textDecoration: "none" }}>
            View My Cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/dashboard/cards" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Back to My Cards
        </Link>
        <h1 className="text-h1" style={{ color: "var(--text-primary)", marginTop: "12px", marginBottom: "4px" }}>
          Edit Card
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Update your business details for{" "}
          <span style={{ color: "var(--gold)", fontWeight: 600 }}>{cardData.businessName}</span>
        </p>
      </div>

      <CardBuilder
        userPlan={user.plan}
        initialData={cardData}
        editSlug={slug}
      />
    </div>
  );
}
