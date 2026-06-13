import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import CardPage from "./page";
import { MOCK_CARDS } from "@/lib/cardData";

// Mock implementation of standard browser methods that are not present in jsdom
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
});

import { Suspense } from "react";

describe("CardPage Component", () => {
  it("renders card details correctly", async () => {
    const mockParams = Promise.resolve({ slug: "demo" });

    // Render the client component wrapped in Suspense, passing down the params promise
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <CardPage params={mockParams} />
        </Suspense>
      );
    });

    // Check if Patel Electronics is rendered as business name
    const businessName = await screen.findByText(MOCK_CARDS.demo.businessName);
    expect(businessName).toBeInTheDocument();

    // Check category
    const category = await screen.findByText(MOCK_CARDS.demo.category);
    expect(category).toBeInTheDocument();

    // Check address
    const address = await screen.findByText(MOCK_CARDS.demo.address, { exact: false });
    expect(address).toBeInTheDocument();

    // Check verified badge
    const verifiedBadge = await screen.findByTitle("Verified Business");
    expect(verifiedBadge).toBeInTheDocument();

    // Check button labels
    expect((await screen.findAllByText("Phone")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("WhatsApp")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Email")).length).toBeGreaterThan(0);
  });
});
