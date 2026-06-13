import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  getCurrentUserAction, 
  createCardAction, 
  updateUserPlanAction,
  createCatalogItemAction,
  verifyLinkAction,
  createBookingAction,
  getBookingsAction,
  updateBookingStatusAction,
  signInAction,
  signUpAction,
  updateCardAction,
  adminCreateUserAction,
  adminDeleteUserAction,
  adminUpdateUserPlanAction,
  verifyGoogleFormLinkAction,
  autoDiscoverGoogleFormFieldsAction
} from "./actions";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockImplementation((args) => {
        const id = args?.where?.id || "demo-user";
        return Promise.resolve({
          id,
          email: id.includes("@") ? id : "demo@cardvault.in",
          name: "Demo User",
          plan: "pro",
          expiresAt: null
        });
      }),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    card: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    catalogItem: {
      count: vi.fn(),
      create: vi.fn(),
    },
    booking: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

let mockCookiesStore: Record<string, string> = {};

// Mock cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockImplementation((name) => mockCookiesStore[name] ? { value: mockCookiesStore[name] } : null),
    delete: vi.fn().mockImplementation((name) => { delete mockCookiesStore[name]; }),
    set: vi.fn().mockImplementation((name, val) => { mockCookiesStore[name] = val; }),
  }))
}));

// Mock NextAuth session retrieval
vi.mock("next-auth", () => {
  const mockNextAuth = vi.fn().mockReturnValue({});
  return {
    default: mockNextAuth,
    getServerSession: vi.fn().mockResolvedValue(null),
  };
});

describe("Backend Server Actions - Plan Validations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesStore = {};
    (cookies as any).mockImplementation(() => ({
      get: vi.fn().mockImplementation((name) => mockCookiesStore[name] ? { value: mockCookiesStore[name] } : null),
      delete: vi.fn().mockImplementation((name) => { delete mockCookiesStore[name]; }),
      set: vi.fn().mockImplementation((name, val) => { mockCookiesStore[name] = val; }),
    }));
  });

  describe("updateUserPlanAction", () => {
    it("updates the user plan and resets expiresAt to 30 days from now", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "test-user-id" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      const mockUpdate = vi.fn().mockResolvedValue({ id: "test-user-id", plan: "pro" });
      (prisma.user.update as any).mockImplementation(mockUpdate);

      const result = await updateUserPlanAction("pro");

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-user-id" },
          data: expect.objectContaining({
            plan: "pro",
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it("updates the user plan and sets expiresAt to 365 days from now for yearly billing", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "test-user-id" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      const mockUpdate = vi.fn().mockResolvedValue({ id: "test-user-id", plan: "pro" });
      (prisma.user.update as any).mockImplementation(mockUpdate);

      const result = await updateUserPlanAction("pro", "yearly");

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-user-id" },
          data: expect.objectContaining({
            plan: "pro",
            expiresAt: expect.any(Date),
          }),
        })
      );

      const calls = (prisma.user.update as any).mock.calls;
      const expiresAtValue = calls[0][0].data.expiresAt;
      const diffDays = Math.round((expiresAtValue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(365);
    });

    it("throws an error for an invalid plan name", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "test-user-id" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      await expect(updateUserPlanAction("invalid-plan")).rejects.toThrow();
    });
  });

  describe("getCurrentUserAction - Expiry & Self Healing", () => {
    it("initializes expiresAt if it is null in the database", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "test-user-id" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      // User has no expiresAt date set
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "test-user-id",
        email: "test@user.com",
        name: "Test User",
        avatarUrl: null,
        plan: "pro",
        expiresAt: null,
        cards: [],
      });

      const mockUpdate = vi.fn().mockResolvedValue({ id: "test-user-id", plan: "pro" });
      (prisma.user.update as any).mockImplementation(mockUpdate);

      const result = await getCurrentUserAction();

      expect(result).not.toBeNull();
      // Should trigger database self-healing update
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-user-id" },
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it("blocks expired plan sessions by deleting cookies and returning planExpired: true", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "test-user-id" });
      const mockCookieDelete = vi.fn();
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
        delete: mockCookieDelete,
      });

      // User has a plan expired yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "test-user-id",
        email: "test@user.com",
        name: "Test User",
        avatarUrl: null,
        plan: "pro",
        expiresAt: yesterday,
        cards: [],
      });

      const result = await getCurrentUserAction();

      expect(result).toEqual({ planExpired: true });
      expect(mockCookieDelete).toHaveBeenCalledWith("session-user-id");
    });
  });

  describe("createCardAction - Plan Limits & Restrictions", () => {
    it("restricts Free plan users to Free themes, forces catalog/booking false, and auto-generates slug", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "free-user" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      // Mock user is Free plan
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "free-user",
        plan: "free",
      });

      (prisma.card.count as any).mockResolvedValue(0);

      const inputCard = {
        businessName: "Free Shop",
        category: "Retail",
        theme: "neon-city", // Neon City is a premium theme
        showCatalog: true, // Catalog is premium
        showBooking: true, // Booking is premium
        slug: "my-custom-slug",
        phone: "1234567890",
        serviceTags: [],
      };

      await createCardAction(inputCard);

      // Verify DB card creation parameters were corrected for Free limits
      expect(prisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "free-user",
            theme: "dark-luxury", // Premium theme overridden to default Free theme
            showCatalog: false, // Locked to false
            showBooking: false, // Locked to false
            slug: "free-shop123", // Forced auto-generated slug
          }),
        })
      );
    });

    it("throws an error if a Free user attempts to exceed the 1 card limit", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "free-user" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "free-user",
        plan: "free",
      });

      // Free user already has 1 card in the database
      (prisma.card.count as any).mockResolvedValue(1);

      const inputCard = {
        businessName: "Second Shop",
        category: "Retail",
        theme: "dark-luxury",
        showCatalog: false,
        showBooking: false,
        slug: "second-shop",
        phone: "1234567890",
        serviceTags: [],
      };

      await expect(createCardAction(inputCard)).rejects.toThrow("PlanLimitReached:FREE:1");
    });
  });

  describe("createCatalogItemAction", () => {
    it("locks catalog items creation for Free plan users", async () => {
      // Card belongs to Free plan user
      (prisma.card.findUnique as any).mockResolvedValue({
        id: "card-id",
        user: {
          plan: "free",
        },
      });

      await expect(
        createCatalogItemAction("card-id", {
          name: "Samosa",
          price: 20,
        })
      ).rejects.toThrow("Failed to create catalog item");
    });

    it("limits catalog items creation to 20 for Pro plan users", async () => {
      // Card belongs to Pro plan user
      (prisma.card.findUnique as any).mockResolvedValue({
        id: "card-id",
        user: {
          plan: "pro",
        },
      });

      // Pro user already has 20 catalog items
      (prisma.catalogItem.count as any).mockResolvedValue(20);

      await expect(
        createCatalogItemAction("card-id", {
          name: "Item 21",
          price: 99,
        })
      ).rejects.toThrow("Failed to create catalog item");
    });
  });

  describe("verifyLinkAction", () => {
    it("passes for valid platform links and reachable URLs", async () => {
      const res = await verifyLinkAction("https://instagram.com/mybusiness", "instagram");
      expect(res.success).toBe(true);
    });

    it("passes for valid whatsappCommunity platform links", async () => {
      const res = await verifyLinkAction("https://chat.whatsapp.com/ABC123xyz", "whatsappCommunity");
      expect(res.success).toBe(true);
    });

    it("fails for invalid whatsappCommunity platform links", async () => {
      const res = await verifyLinkAction("https://google.com", "whatsappCommunity");
      expect(res.success).toBe(false);
      expect(res.error).toContain("whatsapp.com or wa.me");
    });

    it("fails for platform mismatch (crossover validation)", async () => {
      const res = await verifyLinkAction("https://instagram.com/mybusiness", "facebook");
      expect(res.success).toBe(false);
      expect(res.error).toContain("facebook.com or fb.com");
    });
  });

  describe("createBookingAction - Collision Checks & Working Hours Validation", () => {
    const mockHours = JSON.stringify({
      mon: { open: "10:00", close: "21:00", closed: false },
      tue: { open: "10:00", close: "21:00", closed: false },
      wed: { open: "10:00", close: "21:00", closed: false },
      thu: { open: "10:00", close: "21:00", closed: false },
      fri: { open: "10:00", close: "21:00", closed: false },
      sat: { open: "10:00", close: "21:00", closed: false },
      sun: { open: "10:00", close: "21:00", closed: true } // Closed on Sunday
    });

    it("successfully creates a booking when the slot is available and within working hours", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      (prisma.booking.findMany as any).mockResolvedValue([]);
      (prisma.booking.create as any).mockResolvedValue({
        id: "new-booking-id",
        bookingDate: "2026-06-15", // Monday
        bookingTime: "10:00",
      });

      const res = await createBookingAction("card-id", {
        name: "Customer A",
        phone: "1234567890",
        service: "Haircut",
        date: "2026-06-15",
        time: "10:00",
      });

      expect(res).not.toBeNull();
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it("throws a collision error when the slot overlaps within slot duration", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      (prisma.booking.findMany as any).mockResolvedValue([
        {
          id: "existing-booking-id",
          bookingDate: "2026-06-15",
          bookingTime: "10:00",
          status: "pending",
        }
      ]);

      await expect(
        createBookingAction("card-id", {
          name: "Customer B",
          phone: "9876543210",
          service: "Haircut",
          date: "2026-06-15",
          time: "10:20",
        })
      ).rejects.toThrow("SlotAlreadyBooked: This time slot conflicts with an existing booking at 10:00");
    });

    it("successfully creates a booking when the slot is exactly on or after the slot duration limit", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      (prisma.booking.findMany as any).mockResolvedValue([
        {
          id: "existing-booking-id",
          bookingDate: "2026-06-15",
          bookingTime: "10:00",
          status: "pending",
        }
      ]);
      (prisma.booking.create as any).mockResolvedValue({
        id: "new-booking-id",
        bookingDate: "2026-06-15",
        bookingTime: "10:40",
      });

      const res = await createBookingAction("card-id", {
        name: "Customer C",
        phone: "9876543210",
        service: "Haircut",
        date: "2026-06-15",
        time: "10:40",
      });

      expect(res).not.toBeNull();
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it("throws a collision error if the new slot starts before but ends after the existing booking starts", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      (prisma.booking.findMany as any).mockResolvedValue([
        {
          id: "existing-booking-id",
          bookingDate: "2026-06-15",
          bookingTime: "12:00",
          status: "pending",
        }
      ]);

      await expect(
        createBookingAction("card-id", {
          name: "Customer D",
          phone: "9876543210",
          service: "Haircut",
          date: "2026-06-15",
          time: "11:40",
        })
      ).rejects.toThrow("SlotAlreadyBooked: This time slot conflicts with an existing booking at 12:00");
    });

    it("throws an error if attempting to book on a closed day", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      
      await expect(
        createBookingAction("card-id", {
          name: "Customer E",
          phone: "9876543210",
          service: "Haircut",
          date: "2026-06-14", // Sunday
          time: "12:00",
        })
      ).rejects.toThrow("BookingOutsideWorkingHours: The business is closed on Sunday.");
    });

    it("throws an error if attempting to book before opening hours", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      
      await expect(
        createBookingAction("card-id", {
          name: "Customer F",
          phone: "9876543210",
          service: "Haircut",
          date: "2026-06-15", // Monday
          time: "09:59",
        })
      ).rejects.toThrow("BookingOutsideWorkingHours: The booking time must be within business hours. On Monday, working hours are from 10:00 AM to 9:00 PM.");
    });

    it("throws an error if attempting to book after closing hours", async () => {
      (prisma.card.findUnique as any).mockResolvedValue({ id: "card-id", bookingSlotDuration: 40, hours: mockHours });
      
      await expect(
        createBookingAction("card-id", {
          name: "Customer G",
          phone: "9876543210",
          service: "Haircut",
          date: "2026-06-15", // Monday
          time: "21:00",
        })
      ).rejects.toThrow("BookingOutsideWorkingHours: The booking time must be within business hours. On Monday, working hours are from 10:00 AM to 9:00 PM.");
    });
  });

  describe("updateBookingStatusAction", () => {
    it("allows the owner to update the booking status", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "owner-id" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      (prisma.booking.findUnique as any).mockResolvedValue({
        id: "booking-id",
        card: {
          userId: "owner-id",
        },
      });

      (prisma.booking.update as any).mockResolvedValue({
        id: "booking-id",
        status: "confirmed",
      });

      const res = await updateBookingStatusAction("booking-id", "confirmed");
      expect(res.status).toBe("confirmed");
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "booking-id" },
          data: { status: "confirmed" },
        })
      );
    });

    it("prevents status updates for cards not owned by the logged-in user", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "other-id" });
      (cookies as any).mockReturnValue({
        get: mockCookieGet,
      });

      (prisma.booking.findUnique as any).mockResolvedValue({
        id: "booking-id",
        card: {
          userId: "owner-id",
        },
      });

      await expect(
        updateBookingStatusAction("booking-id", "confirmed")
      ).rejects.toThrow("Failed to update booking status");
    });
  });

  describe("Strict Email Validation", () => {
    const invalidEmails = ["cardvault@m", "invalid-email", "me@", "@domain.com", "user@domain", "user@.com"];

    it("signInAction rejects invalid emails", async () => {
      for (const email of invalidEmails) {
        const res = await signInAction(email, "password123");
        expect(res.success).toBe(false);
        expect(res.error).toBe("Please enter a valid email address.");
      }
    });

    it("signUpAction rejects invalid emails", async () => {
      for (const email of invalidEmails) {
        const res = await signUpAction("Test User", email, "password123", "free");
        expect(res.success).toBe(false);
        expect(res.error).toBe("Please enter a valid email address (e.g. name@domain.com).");
      }
    });

    it("createCardAction rejects invalid email", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "test-user" });
      (cookies as any).mockReturnValue({ get: mockCookieGet });

      (prisma.user.findUnique as any).mockResolvedValue({ id: "test-user", plan: "pro" });
      (prisma.card.count as any).mockResolvedValue(0);

      const inputCard = {
        businessName: "Free Shop",
        category: "Retail",
        theme: "dark-luxury",
        showCatalog: false,
        showBooking: false,
        slug: "valid-slug",
        phone: "1234567890",
        serviceTags: [],
        email: "cardvault@m"
      };

      await expect(createCardAction(inputCard)).rejects.toThrow("InvalidEmailAddress: Please enter a valid email address.");
    });

    it("updateCardAction rejects invalid email", async () => {
      const mockCookieGet = vi.fn().mockReturnValue({ value: "owner-id" });
      (cookies as any).mockReturnValue({ get: mockCookieGet });

      (prisma.card.findFirst as any).mockResolvedValue({ id: "card-id", slug: "my-card", userId: "owner-id" });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "owner-id", plan: "pro" });

      const updateData = {
        businessName: "Updated Name",
        category: "Retail",
        theme: "dark-luxury",
        phone: "1234567890",
        email: "cardvault@m",
        serviceTags: [],
      };

      await expect(updateCardAction("my-card", updateData)).rejects.toThrow("InvalidEmailAddress: Please enter a valid email address.");
    });
  });

  describe("adminCreateUserAction - Option B Password Generation", () => {
    beforeEach(() => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockImplementation((args: any) => Promise.resolve({ id: args.data.id, ...args.data }));
      (prisma.card.create as any).mockResolvedValue({ id: "card-id" });
    });

    it("requires admin authentication", async () => {
      const res = await adminCreateUserAction({
        name: "Test Client",
        email: "client@test.com",
        phone: "+91 98765 43210",
        plan: "business",
        expiresAt: null
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized. Admin access required.");
    });

    it("strips +91 country code prefix and generates password from remaining phone number", async () => {
      mockCookiesStore["admin-session-email"] = "dhairyajesani14207@gmail.com";

      const res = await adminCreateUserAction({
        name: "Test Client",
        email: "client@test.com",
        phone: "+91 98765 43210",
        plan: "business",
        expiresAt: null
      });

      expect(res.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalled();

      const createCall = (prisma.user.create as any).mock.calls[0][0];
      const passwordHash = createCall.data.passwordHash;

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-client-test-com",
        email: "client@test.com",
        passwordHash: passwordHash,
        plan: "business"
      });

      const signInRes = await signInAction("client@test.com", "9876543210");
      expect(signInRes.success).toBe(true);

      const signInResFail = await signInAction("client@test.com", "+91 98765 43210");
      expect(signInResFail.success).toBe(false);
    });

    it("strips 91 prefix when entered as 12-digit number (e.g. 919876543210)", async () => {
      mockCookiesStore["admin-session-email"] = "blyfashion@gmail.com";

      const res = await adminCreateUserAction({
        name: "Test Client",
        email: "client2@test.com",
        phone: "919876543210",
        plan: "business",
        expiresAt: null
      });

      expect(res.success).toBe(true);
      const createCall = (prisma.user.create as any).mock.calls[0][0];
      const passwordHash = createCall.data.passwordHash;

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-client2-test-com",
        email: "client2@test.com",
        passwordHash: passwordHash,
        plan: "business"
      });

      const signInRes = await signInAction("client2@test.com", "9876543210");
      expect(signInRes.success).toBe(true);
    });

    it("does not strip 91 when it is a standard 10-digit number (e.g. 9123456789)", async () => {
      mockCookiesStore["admin-session-email"] = "dhairyajesani14207@gmail.com";

      const res = await adminCreateUserAction({
        name: "Test Client",
        email: "client3@test.com",
        phone: "9123456789",
        plan: "business",
        expiresAt: null
      });

      expect(res.success).toBe(true);
      const createCall = (prisma.user.create as any).mock.calls[0][0];
      const passwordHash = createCall.data.passwordHash;

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-client3-test-com",
        email: "client3@test.com",
        passwordHash: passwordHash,
        plan: "business"
      });

      const signInRes = await signInAction("client3@test.com", "9123456789");
      expect(signInRes.success).toBe(true);

      const signInResFail = await signInAction("client3@test.com", "23456789");
      expect(signInResFail.success).toBe(false);
    });

    it("handles foreign numbers by stripping non-digits only", async () => {
      mockCookiesStore["admin-session-email"] = "dhairyajesani14207@gmail.com";

      const res = await adminCreateUserAction({
        name: "Test Client",
        email: "client4@test.com",
        phone: "+1 (555) 123-4567",
        plan: "business",
        expiresAt: null
      });

      expect(res.success).toBe(true);
      const createCall = (prisma.user.create as any).mock.calls[0][0];
      const passwordHash = createCall.data.passwordHash;

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-client4-test-com",
        email: "client4@test.com",
        passwordHash: passwordHash,
        plan: "business"
      });

      const signInRes = await signInAction("client4@test.com", "15551234567");
      expect(signInRes.success).toBe(true);
    });
  });

  describe("adminDeleteUserAction", () => {
    it("requires admin authentication", async () => {
      const res = await adminDeleteUserAction("user-to-delete");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized. Admin access required.");
    });

    it("deletes user and cascades", async () => {
      mockCookiesStore["admin-session-email"] = "dhairyajesani14207@gmail.com";
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-to-delete",
        email: "delete@test.com",
        plan: "free"
      });
      prisma.user.delete = vi.fn().mockResolvedValue({ id: "user-to-delete" });

      const res = await adminDeleteUserAction("user-to-delete");
      expect(res.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-to-delete" } });
    });
  });

  describe("adminUpdateUserPlanAction", () => {
    it("requires admin authentication", async () => {
      const res = await adminUpdateUserPlanAction("user-to-upgrade", "pro-yearly");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized. Admin access required.");
    });

    it("updates user plan and expiry date", async () => {
      mockCookiesStore["admin-session-email"] = "dhairyajesani14207@gmail.com";
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-to-upgrade",
        email: "upgrade@test.com",
        plan: "free"
      });
      prisma.user.update = vi.fn().mockResolvedValue({ id: "user-to-upgrade", plan: "pro" });

      const res = await adminUpdateUserPlanAction("user-to-upgrade", "pro-yearly");
      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalled();
      const updateCall = (prisma.user.update as any).mock.calls[0][0];
      expect(updateCall.where.id).toBe("user-to-upgrade");
      expect(updateCall.data.plan).toBe("pro");
      expect(updateCall.data.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("verifyGoogleFormLinkAction", () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("converts formResponse to viewform and returns success", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
      });
      global.fetch = mockFetch;

      const url = "https://docs.google.com/forms/d/e/1FAIpQLSf123/formResponse?usp=pp_url&entry.123=abc";
      const result = await verifyGoogleFormLinkAction(url);

      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe("https://docs.google.com/forms/d/e/1FAIpQLSf123/viewform?usp=pp_url&entry.123=abc");
      expect(result.success).toBe(true);
    });

    it("converts prefill to viewform and returns success", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
      });
      global.fetch = mockFetch;

      const url = "https://docs.google.com/forms/d/e/1FAIpQLSf123/prefill";
      const result = await verifyGoogleFormLinkAction(url);

      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe("https://docs.google.com/forms/d/e/1FAIpQLSf123/viewform");
      expect(result.success).toBe(true);
    });

    it("leaves standard viewform alone", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
      });
      global.fetch = mockFetch;

      const url = "https://docs.google.com/forms/d/e/1FAIpQLSf123/viewform?entry.123=abc";
      const result = await verifyGoogleFormLinkAction(url);

      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe(url);
      expect(result.success).toBe(true);
    });

    it("returns error on non-200 status code", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
      });
      global.fetch = mockFetch;

      const url = "https://docs.google.com/forms/d/e/1FAIpQLSf123/viewform";
      const result = await verifyGoogleFormLinkAction(url);

      expect(result.success).toBe(false);
      expect(result.error).toContain("404");
    });
  });

  describe("autoDiscoverGoogleFormFieldsAction", () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("scrapes questions and maps entry IDs correctly from FB_PUBLIC_LOAD_DATA_", async () => {
      const mockHtml = `
        <html>
        <body>
          <script>
            var FB_PUBLIC_LOAD_DATA_ = [
              null,
              [
                null,
                [
                  [1001, "Your Name", null, 0, [[11111, null, 0]]],
                  [1002, "Phone Number", null, 0, [[22222, null, 0]]],
                  [1003, "Birthday Date", null, 0, [[33333, null, 0]]],
                  [1004, "Anniversary Date", null, 0, [[44444, null, 0]]]
                ]
              ]
            ];
          </script>
        </body>
        </html>
      `;

      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve(mockHtml)
      });
      global.fetch = mockFetch;

      const url = "https://docs.google.com/forms/d/e/1FAIpQLSf123/viewform";
      const result = await autoDiscoverGoogleFormFieldsAction(url);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.fields).toEqual({
        name: "entry.11111",
        phone: "entry.22222",
        birthday: "entry.33333",
        anniversary: "entry.44444"
      });
    });

    it("returns error on non-200 status code", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404
      });
      global.fetch = mockFetch;

      const url = "https://docs.google.com/forms/d/e/1FAIpQLSf123/viewform";
      const result = await autoDiscoverGoogleFormFieldsAction(url);

      expect(result.success).toBe(false);
      expect(result.error).toContain("404");
    });
  });
});
