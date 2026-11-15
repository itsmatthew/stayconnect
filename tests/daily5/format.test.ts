import { describe, expect, it } from "vitest";
import { formatPhotoDate, formatToday } from "@/app/intro/daily5/format";

describe("Daily 5 labels (D5-9)", () => {
  it("writes the photo date as on the polaroid", () => {
    expect(formatPhotoDate(new Date(2023, 6, 2, 14).getTime())).toBe("Jul 2, 2023");
    expect(formatPhotoDate(new Date(2024, 4, 24).getTime())).toBe("May 24, 2024");
  });

  it("writes today's date for the banner", () => {
    expect(formatToday(new Date(2026, 9, 6))).toBe("Tuesday, Oct 6");
  });
});
