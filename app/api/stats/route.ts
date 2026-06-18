import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [totalCards, totalReviews, totalViews, totalUsers] = await Promise.all([
      prisma.card.count(),
      prisma.review.count(),
      prisma.analyticsEvent.count({ where: { eventType: "view" } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      cards: totalCards,
      reviews: totalReviews,
      views: totalViews,
      users: totalUsers,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    // Return fallback values on error so the page still looks good
    return NextResponse.json({
      cards: 0,
      reviews: 0,
      views: 0,
      users: 0,
    });
  }
}
