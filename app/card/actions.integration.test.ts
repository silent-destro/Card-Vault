import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { 
  getCurrentUserAction, 
  createCardAction, 
  updateUserPlanAction,
  createCatalogItemAction,
  signInAction,
  signUpAction
} from "./actions";
import { cookies } from "next/headers";
import { vi } from "vitest";

// We mock cookies to simulate user sessions
vi.mock("next/headers", async (importOriginal) => {
  const actual = await importOriginal();
  let cookieVal = "";
  return {
    ...(actual as any),
    cookies: () => ({
      get: vi.fn().mockImplementation((name) => {
        if (name === "session-user-id") return { value: cookieVal };
        return null;
      }),
      set: vi.fn().mockImplementation((name, val) => {
        if (name === "session-user-id") cookieVal = val;
      }),
      delete: vi.fn().mockImplementation((name) => {
        if (name === "session-user-id") cookieVal = "";
      }),
    })
  };
});

// Mock NextAuth session retrieval to avoid NextAuth issues in tests
vi.mock("next-auth", () => {
  const mockNextAuth = vi.fn().mockReturnValue({});
  return {
    default: mockNextAuth,
    getServerSession: vi.fn().mockResolvedValue(null),
  };
});

describe("Real SQLite Database Integration Tests for Plans", () => {
  const freeEmail = "integration-free@cardvault.in";
  const proEmail = "integration-pro@cardvault.in";
  const businessEmail = "integration-business@cardvault.in";

  const freeUserId = "integration-free-cardvault-in";
  const proUserId = "integration-pro-cardvault-in";
  const businessUserId = "integration-business-cardvault-in";

  beforeAll(async () => {
    // Clear any leftover test data by user email
    await prisma.booking.deleteMany({ where: { card: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } } });
    await prisma.catalogItem.deleteMany({ where: { card: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } } });
    await prisma.review.deleteMany({ where: { card: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } } });
    await prisma.card.deleteMany({ where: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [freeEmail, proEmail, businessEmail] } } });
  });

  afterAll(async () => {
    // Clean up
    await prisma.booking.deleteMany({ where: { card: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } } });
    await prisma.catalogItem.deleteMany({ where: { card: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } } });
    await prisma.review.deleteMany({ where: { card: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } } });
    await prisma.card.deleteMany({ where: { user: { email: { in: [freeEmail, proEmail, businessEmail] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [freeEmail, proEmail, businessEmail] } } });
  });

  it("Verifies FREE Plan features and restrictions end-to-end", async () => {
    // 1. Sign Up and Sign In as Free user
    const registerRes = await signUpAction("Free User", freeEmail, "password123");
    expect(registerRes.success).toBe(true);
    const freeUserId = registerRes.user!.id;

    const loginRes = await signInAction(freeEmail, "password123");
    expect(loginRes.success).toBe(true);

    const cookieStore = await cookies();
    cookieStore.set("session-user-id", freeUserId);

    // Verify User plan is "free"
    const userState = await getCurrentUserAction();
    expect(userState?.plan).toBe("free");
    expect(userState?.expiresAt).not.toBeNull();

    // 2. Create card under Free limits
    const inputCard = {
      businessName: "Free Bakery",
      category: "Food",
      theme: "neon-city", // Premium theme (should be overridden)
      showCatalog: true, // Premium feature (should be forced false)
      showBooking: true, // Premium feature (should be forced false)
      slug: "custom-bakery-slug", // Premium feature (should be overridden)
      phone: "9999999999",
      serviceTags: ["fresh", "delicious"],
    };

    const newCard = await createCardAction(inputCard);
    expect(newCard.slug).toBe("free-bakery123"); // Verifies Free auto-slug generation
    expect(newCard.theme).toBe("dark-luxury"); // Verifies premium theme override
    expect(newCard.showCatalog).toBe(false); // Verifies catalog lock
    expect(newCard.showBooking).toBe(false); // Verifies booking lock

    // 3. Attempt to exceed card limit (max 1)
    const secondCard = {
      businessName: "Second Shop",
      category: "Food",
      theme: "dark-luxury",
      showCatalog: false,
      showBooking: false,
      slug: "second-shop",
      phone: "8888888888",
      serviceTags: [],
    };
    await expect(createCardAction(secondCard)).rejects.toThrow("PlanLimitReached:FREE:1");

    // 4. Attempt to add a catalog item to the Free card (should throw exception)
    await expect(createCatalogItemAction(newCard.id, { name: "Cake", price: 500 })).rejects.toThrow();
  });

  it("Verifies PRO Plan upgrades, card limits (2), catalog limit (20) end-to-end", async () => {
    // 1. Sign Up, Sign In and Upgrade to Pro
    const registerRes = await signUpAction("Pro User", proEmail, "password123");
    expect(registerRes.success).toBe(true);
    const proUserId = registerRes.user!.id;

    await signInAction(proEmail, "password123");
    const cookieStore = await cookies();
    cookieStore.set("session-user-id", proUserId);

    await updateUserPlanAction("pro");
    const userState = await getCurrentUserAction();
    expect(userState?.plan).toBe("pro");

    // 2. Create 2 cards successfully
    const cards = [];
    for (let i = 1; i <= 2; i++) {
      const card = await createCardAction({
        businessName: `Pro Shop ${i}`,
        category: "Services",
        theme: "neon-city", // Premium theme allowed
        showCatalog: true, // Allowed
        showBooking: true, // Allowed
        slug: `pro-shop-slug-${i}`, // Custom slug allowed
        phone: "7777777777",
        serviceTags: [],
      });
      cards.push(card);
    }
    expect(cards.length).toBe(2);

    // 3. 3rd card creation should fail (limit is 2)
    const thirdCard = {
      businessName: "Pro Shop 3",
      category: "Services",
      theme: "dark-luxury",
      showCatalog: false,
      showBooking: false,
      slug: "pro-shop-slug-3",
      phone: "6666666666",
      serviceTags: [],
    };
    await expect(createCardAction(thirdCard)).rejects.toThrow("PlanLimitReached:PRO:2");

    // 4. Add 20 catalog items successfully to a Pro card
    const firstCard = cards[0];
    for (let i = 1; i <= 20; i++) {
      await createCatalogItemAction(firstCard.id, {
        name: `Product ${i}`,
        price: i * 10,
      });
    }

    // 5. 21st catalog item should fail (limit is 20)
    await expect(createCatalogItemAction(firstCard.id, {
      name: "Product 21",
      price: 210,
    })).rejects.toThrow("Failed to create catalog item");
  });

  it("Verifies BUSINESS Plan upgrades, card limits (4), and unlimited catalog end-to-end", async () => {
    // 1. Sign Up, Sign In and Upgrade to Business
    const registerRes = await signUpAction("Biz User", businessEmail, "password123");
    expect(registerRes.success).toBe(true);
    const businessUserId = registerRes.user!.id;

    await signInAction(businessEmail, "password123");
    const cookieStore = await cookies();
    cookieStore.set("session-user-id", businessUserId);

    await updateUserPlanAction("business");
    const userState = await getCurrentUserAction();
    expect(userState?.plan).toBe("business");

    // 2. Create 4 cards successfully
    const cards = [];
    for (let i = 1; i <= 4; i++) {
      const card = await createCardAction({
        businessName: `Biz Shop ${i}`,
        category: "Enterprise",
        theme: "royal-gold", // Premium theme
        showCatalog: true,
        showBooking: true,
        slug: `biz-shop-slug-${i}`,
        phone: "5555555555",
        serviceTags: [],
      });
      cards.push(card);
    }
    expect(cards.length).toBe(4);

    // 3. 5th card creation should fail (limit is 4)
    const fifthCard = {
      businessName: "Biz Shop 5",
      category: "Enterprise",
      theme: "dark-luxury",
      showCatalog: false,
      showBooking: false,
      slug: "biz-shop-slug-5",
      phone: "4444444444",
      serviceTags: [],
    };
    await expect(createCardAction(fifthCard)).rejects.toThrow("PlanLimitReached:BUSINESS:4");

    // 4. Create 25 catalog items on a Business card (verifies no Pro limit of 20 items)
    const firstCard = cards[0];
    for (let i = 1; i <= 25; i++) {
      const item = await createCatalogItemAction(firstCard.id, {
        name: `Biz Product ${i}`,
        price: i * 20,
      });
      expect(item.id).not.toBeNull();
    }
  });
});
