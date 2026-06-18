import { describe, test, expect } from "vitest";
import { generateDynamicReview, clearReviewCache } from "@/lib/reviewGenerator";

describe("Review Uniqueness 100 Times Test", () => {
  const languages = ["en", "hi", "gu"];
  const tones = ["friendly", "formal", "enthusiastic"];
  const starRatings = [1, 2, 3, 4, 5];
  const tagsPool = [
    ["Quality Service", "Friendly Staff"],
    ["Reasonable Price", "Prompt Response"],
    ["Highly Professional", "Clean Environment"],
    ["Excellent Quality", "Supportive Team"],
    ["Great Atmosphere", "Super Fast"]
  ];

  languages.forEach((lang) => {
    test(`generates 100 unique reviews for language: ${lang}`, () => {
      clearReviewCache();
      const seenShorts = new Set<string>();
      const seenDetaileds = new Set<string>();
      const seenStories = new Set<string>();

      for (let i = 0; i < 100; i++) {
        // Pick randomized inputs
        const tone = tones[i % tones.length];
        const stars = starRatings[i % starRatings.length];
        const tags = tagsPool[i % tagsPool.length];
        const businessName = `Test Business ${i}`;

        const review = generateDynamicReview({
          businessName,
          stars,
          tone,
          tags,
          language: lang,
        });

        // Ensure no variant is empty
        expect(review.short).toBeTruthy();
        expect(review.detailed).toBeTruthy();
        expect(review.story).toBeTruthy();

        // Normalise by removing the business name to test actual template uniqueness
        const normalizedShort = review.short.replace(businessName, "BUSINESS");
        const normalizedDetailed = review.detailed.replace(businessName, "BUSINESS");
        const normalizedStory = review.story.replace(businessName, "BUSINESS");

        // Verify uniqueness
        expect(seenShorts.has(normalizedShort)).toBe(false);
        expect(seenDetaileds.has(normalizedDetailed)).toBe(false);
        expect(seenStories.has(normalizedStory)).toBe(false);

        seenShorts.add(normalizedShort);
        seenDetaileds.add(normalizedDetailed);
        seenStories.add(normalizedStory);
      }

      expect(seenShorts.size).toBe(100);
      expect(seenDetaileds.size).toBe(100);
      expect(seenStories.size).toBe(100);
      console.log(`Successfully verified 100 unique reviews for ${lang}!`);
    });
  });
});
