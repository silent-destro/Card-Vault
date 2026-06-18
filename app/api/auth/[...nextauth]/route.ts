import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Determine the correct base URL — works on Vercel, localhost, and custom domains
function getBaseUrl(): string {
  // 1. Explicit NEXTAUTH_URL (highest priority)
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  // 2. Vercel automatically provides VERCEL_URL (without protocol)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // 3. Local dev fallback
  return "http://localhost:3000";
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production",
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;

      try {
        const email = user.email.toLowerCase();
        
        // Expiry check: block Google sign-in if the user's plan is already expired in the DB
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser && existingUser.expiresAt && existingUser.expiresAt < new Date()) {
          console.warn(`Blocked Google sign-in for expired user: ${email}`);
          return false;
        }

        const userId = `google-${email.replace(/[^a-z0-9]/g, "-")}`;

        let signupPlan = "free";
        try {
          const cookieStore = await cookies();
          signupPlan = cookieStore.get("signup-plan")?.value || "free";
        } catch (cookieError) {
          // Cookie read may fail in some environments — default to free
        }
        const finalPlan = ["free", "pro", "business"].includes(signupPlan) ? signupPlan : "free";
        const expiresAt = finalPlan === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const dbUser = await prisma.user.upsert({
          where: { email },
          update: {
            name: user.name || undefined,
            avatarUrl: user.image || undefined,
          },
          create: {
            id: userId,
            email,
            name: user.name || email.split("@")[0],
            avatarUrl: user.image || undefined,
            plan: finalPlan,
            expiresAt,
          },
        });

        (user as any).dbUserId = dbUser.id;
        return true;
      } catch (error) {
        console.error("NextAuth signIn callback error:", error);
        // Return true anyway so the user can log in even if DB write fails
        return true;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.dbUserId = (user as any).dbUserId;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.dbUserId) {
        (session as any).dbUserId = token.dbUserId;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      const base = getBaseUrl();
      // After Google OAuth callback, go to the session bridge
      if (url.includes("/api/auth/callback/google")) {
        return `${base}/api/auth/set-session`;
      }
      // Allow same-origin URLs
      if (url.startsWith(base) || url.startsWith(baseUrl)) return url;
      // Default to dashboard
      return `${base}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
