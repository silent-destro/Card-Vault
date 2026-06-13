import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    console.log("=== set-session/route.ts GET started ===");
    console.log("Incoming cookies:", cookieStore.getAll().map(c => `${c.name}=${c.value}`));

    // When logging in with Google:
    // - Clear session-user-id cookie explicitly
    // - Let NextAuth manage its own cookie
    cookieStore.delete("session-user-id");
    console.log("Explicitly cleared custom session-user-id cookie for Google login");

    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirect") || "/dashboard";
    console.log("Redirecting to:", redirectTo);
    console.log("=== set-session/route.ts GET completed ===");
    const targetUrl = new URL(redirectTo, request.url);
    targetUrl.searchParams.set("login", "success");
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("Session bridge error:", error);
    const fallbackUrl = new URL("/dashboard", request.url);
    fallbackUrl.searchParams.set("login", "success");
    return NextResponse.redirect(fallbackUrl);
  }
}
