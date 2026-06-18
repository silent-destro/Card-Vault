import { describe, it, expect, vi } from "vitest";
import { getBusinessStatus, type HoursData } from "./cardData";

describe("getBusinessStatus", () => {
  const mockHours: Record<string, HoursData> = {
    mon: { open: "09:00", close: "18:00", closed: false },
    tue: { open: "09:00", close: "18:00", closed: false },
    wed: { open: "09:00", close: "18:00", closed: false },
    thu: { open: "09:00", close: "18:00", closed: false },
    fri: { open: "09:00", close: "18:00", closed: false },
    sat: { open: "10:00", close: "14:00", closed: false },
    sun: { open: "00:00", close: "00:00", closed: true },
  };

  it("should return Closed Today for closed days", () => {
    // Sunday
    const sundayDate = new Date(2026, 4, 31); // May 31, 2026 is Sunday
    vi.setSystemTime(sundayDate);

    const status = getBusinessStatus(mockHours);
    expect(status.isOpen).toBe(false);
    expect(status.message).toBe("Sunday: Closed Today · Opens tomorrow at 9:00 AM");
  });

  it("should return Open Now during opening hours", () => {
    // Monday at 12:00 PM (noon)
    const mondayDate = new Date(2026, 5, 1, 12, 0); // June 1, 2026 is Monday
    vi.setSystemTime(mondayDate);

    const status = getBusinessStatus(mockHours);
    expect(status.isOpen).toBe(true);
    expect(status.message).toContain("Open Now");
  });

  it("should return Opens at X if before opening hours", () => {
    // Monday at 8:00 AM
    const mondayDate = new Date(2026, 5, 1, 8, 0); // June 1, 2026 is Monday
    vi.setSystemTime(mondayDate);

    const status = getBusinessStatus(mockHours);
    expect(status.isOpen).toBe(false);
    expect(status.message).toBe("Monday: Closed · Opens today at 9:00 AM");
  });

  it("should return Closed Now if after closing hours", () => {
    // Monday at 8:00 PM (20:00)
    const mondayDate = new Date(2026, 5, 1, 20, 0); // June 1, 2026 is Monday
    vi.setSystemTime(mondayDate);

    const status = getBusinessStatus(mockHours);
    expect(status.isOpen).toBe(false);
    expect(status.message).toBe("Monday: Closed Now · Opens tomorrow at 9:00 AM");
  });
});
