import { render, screen, act, fireEvent } from "@testing-library/react";
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

  it("opens QR modal and triggers QR code download", async () => {
    const mockParams = Promise.resolve({ slug: "demo" });

    // Mock fetch and URL methods
    const mockBlob = new Blob(["mock-qr-code"], { type: "image/png" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    }));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    // Mock HTMLAnchorElement.prototype.click
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <CardPage params={mockParams} />
        </Suspense>
      );
    });

    // Click the QR Code button to open modal
    const qrTrigger = await screen.findByTitle("Scan QR Code");
    expect(qrTrigger).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(qrTrigger);
    });

    // Verify modal is open
    expect(await screen.findByText("Scan QR to open digital card")).toBeInTheDocument();
    
    // Find Download button
    const downloadBtn = await screen.findByText("Download QR Code");
    expect(downloadBtn).toBeInTheDocument();

    // Click Download button
    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    // Verify it attempted to fetch the QR Code
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.qrserver.com/v1/create-qr-code/")
    );

    // Clean up mocks
    vi.restoreAllMocks();
  });
});
