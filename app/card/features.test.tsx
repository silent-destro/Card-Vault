import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import React from "react";
import CardPage from "./[slug]/page";
import ReviewPage from "./[slug]/review/page";
import CardBuilder from "@/components/CardBuilder";
import { MOCK_CARDS } from "@/lib/cardData";
import { createBookingAction, createReviewAction, recordAnalyticsEventAction, getCardData } from "./actions";

// Mock server actions
vi.mock("./actions", () => ({
  getCardData: vi.fn(),
  createBookingAction: vi.fn().mockResolvedValue({ id: "booking-id" }),
  createReviewAction: vi.fn().mockResolvedValue({ id: "review-id" }),
  recordAnalyticsEventAction: vi.fn().mockResolvedValue({ success: true }),
  checkSlugAvailability: vi.fn().mockResolvedValue(true),
  getAvailableFreeSlug: vi.fn().mockResolvedValue("free-slug123"),
  createCardAction: vi.fn().mockResolvedValue({ id: "card-id", slug: "mock-slug" }),
  updateCardAction: vi.fn().mockResolvedValue({ id: "card-id", slug: "mock-slug" }),
  getCurrentUserAction: vi.fn().mockResolvedValue(null),
  generateAIReviewAction: vi.fn().mockResolvedValue({
    short: "Outstanding experience at Patel Electronics! Highly recommend.",
    detailed: "I had a wonderful experience at Patel Electronics. The service was outstanding and the team was very helpful.",
    story: "During my search for a professional team, I came across Patel Electronics."
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock standard browser dependencies
beforeAll(() => {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));

  // Mock sessionStorage
  const store: Record<string, string> = {};
  vi.stubGlobal("sessionStorage", {
    getItem: vi.fn().mockImplementation(key => store[key] || null),
    setItem: vi.fn().mockImplementation((key, val) => store[key] = val),
    removeItem: vi.fn().mockImplementation(key => delete store[key]),
    clear: vi.fn().mockImplementation(() => {
      for (const k in store) delete store[k];
    }),
  });

  // Mock clipboard
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });

  // Mock window.alert
  vi.stubGlobal("alert", vi.fn());
});

describe("In-Depth Feature Flow Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe("1. Appointment Booking Feature Flow", () => {
    it("completes booking flow from button click to successful confirmation", async () => {
      // Mock card data with booking enabled
      (getCardData as any).mockResolvedValue({
        ...MOCK_CARDS.demo,
        id: "test-card-123",
        showBooking: true,
        userPlan: "pro",
      });

      const params = Promise.resolve({ slug: "demo" });

      await act(async () => {
        render(<CardPage params={params} />);
      });

      // Find and click "Book Appointment" grid item
      const bookBtn = await screen.findByText("Book Appointment");
      expect(bookBtn).toBeInTheDocument();
      fireEvent.click(bookBtn);

      // Verify the booking bottom sheet is open
      expect(screen.getByText("Your Name")).toBeInTheDocument();
      expect(screen.getByText("Confirm Booking")).toBeInTheDocument();

      // Fill out the booking form details
      fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: "Anoop Kumar" } });
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "9876543210" } });
      fireEvent.change(screen.getByLabelText(/Service/i), { target: { value: "Full Health Checkup" } });
      fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: "2026-06-25" } });
      fireEvent.change(screen.getByLabelText(/Time/i), { target: { value: "10:30" } });

      // Submit booking form
      fireEvent.click(screen.getByText("Confirm Booking"));

      // Verify booking server action gets invoked with correct inputs
      await waitFor(() => {
        expect(createBookingAction).toHaveBeenCalledWith(
          "test-card-123",
          {
            name: "Anoop Kumar",
            phone: "+91 9876543210",
            service: "Full Health Checkup",
            date: "2026-06-25",
            time: "10:30",
            birthday: "",
            anniversary: ""
          }
        );
      });

      // Verify success screen renders correctly
      expect(await screen.findByText("Booking Details Sent!")).toBeInTheDocument();
      expect(screen.getByText(/booking details have been sent on WhatsApp/i)).toBeInTheDocument();
    });
  });

  describe("2. AI Review Assistant Flow", () => {
    it("navigates language, highlights, tone, generates reviews and copies successfully", async () => {
      (getCardData as any).mockResolvedValue({
        ...MOCK_CARDS.demo,
        id: "test-card-123",
        serviceTags: ["Excellent Quality", "Friendly Staff", "Fast Delivery"],
        reviewLimitReached: false,
      });

      const params = Promise.resolve({ slug: "demo" });

      await act(async () => {
        render(<ReviewPage params={params} />);
      });

      // Step 1: Language selection page displays. Let's select English.
      const englishBtn = await screen.findByText("English");
      expect(englishBtn).toBeInTheDocument();
      fireEvent.click(englishBtn);

      // Step 2: Highlights selection page displays
      expect(await screen.findByText("What Did You Like?")).toBeInTheDocument();

      // Click highlight tag
      const tagBtn = screen.getByText("Excellent Quality");
      fireEvent.click(tagBtn);

      // Select Enthusiastic Tone
      const toneBtn = screen.getByText("Enthusiastic");
      fireEvent.click(toneBtn);

      // Click Generate Review
      const generateBtn = screen.getByText("✨ Generate My Review");
      fireEvent.click(generateBtn);

      // Step 3: Review list outputs and can be copied
      expect(await screen.findByText("Your Review is Ready! 🎉", {}, { timeout: 5000 })).toBeInTheDocument();

      // Wait for typewriter simulation to display review text
      await waitFor(() => {
        expect(screen.getByText(/experience at Patel Electronics/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Click Copy Review
      const copyBtn = screen.getByText(/Copy & Post Review/i);
      fireEvent.click(copyBtn);

      // Verify copied clipboard action and database recording
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      await waitFor(() => {
        expect(createReviewAction).toHaveBeenCalledWith(
          "test-card-123",
          expect.objectContaining({
            rating: 5,
            language: "en",
            tone: "enthusiastic",
            tags: ["Excellent Quality"],
            platform: "google"
          })
        );
      });
    });
  });

  describe("3. CardBuilder Draft Saving & Plan Restrictions", () => {
    it("reverts premium themes and locks catalog/booking options for Free plan users", async () => {
      const mockRouter = { push: vi.fn() };
      
      render(
        <CardBuilder 
          userPlan="free" 
        />
      );

      // 1. Check draft auto-saving occurs in sessionStorage on name input
      const nameInput = screen.getByLabelText(/Business Name/i);
      fireEvent.change(nameInput, { target: { value: "My Small Shop" } });
      
      const categorySelect = screen.getByLabelText(/Business Category/i);
      fireEvent.change(categorySelect, { target: { value: "Electronics" } });
      
      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalledWith(
          "cardvault_create_draft",
          expect.stringContaining("My Small Shop")
        );
      });

      // Advance to Step 6 (Product Catalog)
      const continueBtn = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(continueBtn); // Go to step 2
      await screen.findByText("Contact Details");

      // Fill Step 2 details
      const phoneInput = screen.getByPlaceholderText("98765 43210");
      fireEvent.change(phoneInput, { target: { value: "9876543210" } });
      const emailInput = screen.getByPlaceholderText("business@gmail.com");
      fireEvent.change(emailInput, { target: { value: "test@business.com" } });
      
      await waitFor(() => {
        expect(phoneInput).toHaveValue("9876543210");
        expect(emailInput).toHaveValue("test@business.com");
      });
      
      fireEvent.click(continueBtn); // Go to step 3
      await screen.findByText("Location");

      // Fill Step 3 details
      const addressInput = screen.getByPlaceholderText("Shop 12, Main Market...");
      fireEvent.change(addressInput, { target: { value: "123 Main St" } });
      const cityInput = screen.getByPlaceholderText("e.g. Rajkot");
      fireEvent.change(cityInput, { target: { value: "Rajkot" } });

      await waitFor(() => {
        expect(addressInput).toHaveValue("123 Main St");
        expect(cityInput).toHaveValue("Rajkot");
      });
      
      fireEvent.click(continueBtn); // Go to step 4
      await screen.findByText("Social Media");

      fireEvent.click(continueBtn); // Go to step 5
      await screen.findByText("Business Hours");

      fireEvent.click(continueBtn); // Go to step 6
      await screen.findByText("Products & Catalog");

      // 2. Try to toggle premium catalog - should trigger plan alert and keep locked
      const catalogToggle = screen.getByRole("button", { name: /Enable Product Catalog/i });
      fireEvent.click(catalogToggle);

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("Product Catalog is a premium Pro/Business feature")
      );

      // Advance to Step 8 (Theme & Finish)
      fireEvent.click(continueBtn); // Go to step 7
      await screen.findByText("Payment & Booking");

      fireEvent.click(continueBtn); // Go to step 8
      await screen.findByText("Theme & Final Setup");

      // 3. Try to select a premium theme on step 8 - should block
      const neonThemeCard = screen.getAllByTitle("Premium Theme")[0]; // Premium icon badge
      fireEvent.click(neonThemeCard);

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("theme is a premium Pro/Business feature")
      );
    });
  });
});
