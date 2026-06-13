import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const isProtectedDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin/dashboard");

  if (isProtectedDashboard) {
    const response = NextResponse.next();

    // CRITICAL: Prevent browser from caching any dashboard page.
    // This ensures the "Back" button always triggers a fresh server request
    // instead of serving a stale cached page, so auth is always re-checked.
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/dashboard/:path*",
  ],
};
