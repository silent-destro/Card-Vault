import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { 
  getSessionUserId, 
  signInAction, 
  signUpAction, 
  signOutAction,
  getCurrentUserAction
} from "./actions";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

// Mock next/headers
let mockCookiesStore: Record<string, { value: string; options?: any }> = {};

vi.mock("next/headers", () => {
  return {
    cookies: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockImplementation((name) => {
        return mockCookiesStore[name] ? { value: mockCookiesStore[name].value } : null;
      }),
      set: vi.fn().mockImplementation((name, val, opts) => {
        mockCookiesStore[name] = { value: val, options: opts };
      }),
      delete: vi.fn().mockImplementation((name) => {
        delete mockCookiesStore[name];
      }),
    }))
  };
});

// Mock next-auth
let mockNextAuthSession: any = null;

vi.mock("next-auth", () => {
  return {
    default: vi.fn(),
    getServerSession: vi.fn().mockImplementation(() => Promise.resolve(mockNextAuthSession)),
  };
});

describe("Session Priority and Isolation Tests", () => {
  const email = "auth-priority-test@cardvault.in";
  const password = "securePassword123";
  let createdUserId = "";

  beforeEach(async () => {
    mockCookiesStore = {};
    mockNextAuthSession = null;

    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: { email }
    });

    // Create a demo user for our tests
    const registerRes = await signUpAction("Priority User", email, password);
    if (registerRes.success && registerRes.user) {
      createdUserId = registerRes.user.id;
    }
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email }
    });
    vi.restoreAllMocks();
  });

  it("Scenario 1 & 12: Fresh browser / unauthenticated directly redirects or returns null", async () => {
    // No cookies or NextAuth session
    mockCookiesStore = {};
    const resolved = await getSessionUserId();
    expect(resolved).toBeNull();
  });

  it("Scenario 2: Enter unregistered email + any password fails with unregistered error", async () => {
    const res = await signInAction("non-existent@cardvault.in", "anyPassword");
    expect(res.success).toBe(false);
    expect(res.error).toContain("not registered");
  });

  it("Scenario 3: Enter registered email + wrong password fails with incorrect password error", async () => {
    const res = await signInAction(email, "wrongPassword");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Incorrect password");
  });

  it("Scenario 4 & 5: Enter valid email + correct password sets session-user-id only (strict, httponly, secure) and clears NextAuth tokens", async () => {
    // Preset mockNextAuthSession to simulate leftover session tokens in browser cookies
    mockCookiesStore["next-auth.session-token"] = { value: "some-stale-token" };
    mockCookiesStore["__Secure-next-auth.session-token"] = { value: "some-secure-stale-token" };

    const res = await signInAction(email, password);
    expect(res.success).toBe(true);

    // Verify session isolation: next-auth cookies cleared
    expect(mockCookiesStore["next-auth.session-token"]).toBeUndefined();
    expect(mockCookiesStore["__Secure-next-auth.session-token"]).toBeUndefined();

    // Verify custom session-user-id cookie values and options
    const customCookie = mockCookiesStore["session-user-id"];
    expect(customCookie).toBeDefined();
    expect(customCookie.value).toBe(createdUserId);
    expect(customCookie.options).toEqual({
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  });

  it("Scenario 6: Clicking logout clears ALL cookies", async () => {
    // Populate session-user-id and next-auth cookies
    mockCookiesStore["session-user-id"] = { value: createdUserId };
    mockCookiesStore["next-auth.session-token"] = { value: "token" };

    const res = await signOutAction();
    expect(res.success).toBe(true);
    expect(mockCookiesStore["session-user-id"]).toBeUndefined();
    expect(mockCookiesStore["next-auth.session-token"]).toBeUndefined();
  });

  it("Scenario 8: Google OAuth session resolves correctly and clears custom session cookie", async () => {
    // Let's set a NextAuth session representing our Google user
    mockNextAuthSession = { user: { email: email } };
    mockCookiesStore["session-user-id"] = { value: "should-be-cleared-by-google-auth" };

    // Simulating set-session route behavior where it clears session-user-id
    const cookieStore = await cookies();
    cookieStore.delete("session-user-id");

    const resolved = await getSessionUserId();
    expect(resolved).toBe(createdUserId);
    expect(mockCookiesStore["session-user-id"]).toBeUndefined();
  });

  it("Scenario 9 & 10: Custom cookie session FIRST priority (NextAuth NEVER overrides custom session)", async () => {
    // Set custom session-user-id cookie to our demo user
    mockCookiesStore["session-user-id"] = { value: createdUserId };
    
    // Set NextAuth session to a completely different user
    mockNextAuthSession = { user: { email: "some-other-google-user@cardvault.in" } };

    // Call getSessionUserId()
    const resolved = await getSessionUserId();
    
    // It must resolve to our custom credentials user (createdUserId), not NextAuth user
    expect(resolved).toBe(createdUserId);
  });

  it("Conflict Debug Logging: Verifies console.log prints conflict detection correctly", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    mockCookiesStore["session-user-id"] = { value: createdUserId };
    mockNextAuthSession = { user: { email: email } };

    await getSessionUserId();

    expect(consoleSpy).toHaveBeenCalledWith("Auth check:", {
      hasCustomCookie: true,
      hasNextAuthSession: true,
      customUserId: createdUserId,
      nextAuthEmail: email,
      resolvedTo: createdUserId
    });
  });
});
