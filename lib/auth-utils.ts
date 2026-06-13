// lib/auth-utils.ts
import { signOutAction } from "@/app/card/actions";
import { signOut as nextAuthSignOut } from "next-auth/react";

export function forceRedirect(url: string) {
  if (typeof window !== "undefined") {
    // Use replace so the browser back button doesn't return to the protected page
    window.location.replace(url);
  }
}

export async function forceLogout(redirectUrl: string = "/sign-in") {
  // 1. Call server logout action (hard-expires cookies server-side)
  try {
    await signOutAction();
  } catch (err) {
    console.error("Server sign out failed during forceLogout:", err);
  }

  // 2. Call NextAuth client-side sign out
  try {
    await nextAuthSignOut({ redirect: false });
  } catch (err) {
    console.error("NextAuth client sign out failed during forceLogout:", err);
  }

  // 3. Belt-and-suspenders: also hard-expire cookies client-side
  //    This catches edge cases where the server cookie set fails
  if (typeof document !== "undefined") {
    const killCookie = (name: string) => {
      // Expire via multiple path/domain combos to ensure it's gone
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; max-age=0;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; max-age=0; samesite=lax;`;
    };
    killCookie("session-user-id");
    killCookie("next-auth.session-token");
    killCookie("__Secure-next-auth.session-token");
  }

  // 4. Clear client-side sessionStorage
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("cv_session_active");
    } catch (e) {}
  }

  // 5. Force full page navigation to sign-in (not router.push, not history.replaceState)
  //    window.location.replace ensures browser Back button won't return to dashboard
  forceRedirect(redirectUrl);
}
