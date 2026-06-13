import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReviewPage from "./page";
import { MOCK_CARDS } from "@/lib/cardData";

import { Suspense } from "react";

describe("ReviewPage Component", () => {
  it("renders review flow steps and handles interactions", async () => {
    const mockParams = Promise.resolve({ slug: "demo" });

    // Render ReviewPage wrapped in Suspense
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <ReviewPage params={mockParams} />
        </Suspense>
      );
    });

    // Check header title and business info using async findByText
    expect(await screen.findByText(/Write a/i)).toBeInTheDocument();
    expect(await screen.findByText(MOCK_CARDS.demo.businessName)).toBeInTheDocument();

    // Verify step 2 message is visible directly
    expect(await screen.findByText("Choose Your Language")).toBeInTheDocument();
  });
});
