import { describe, expect, it } from "vitest";
import { captionPlaceholder, cleanCaption, CAPTION_MAX } from "@/app/intro/archive/copy";
import { periodFromKey } from "@/app/intro/archive/periods";

describe("caption (ARC-13)", () => {
  it("the placeholder fits the period", () => {
    expect(captionPlaceholder(periodFromKey("2026-W43"))).toBe("what made this week");
    expect(captionPlaceholder(periodFromKey("2026-B"))).toBe("what made the week between years");
    expect(captionPlaceholder(periodFromKey("2026-10"))).toBe("what defined October");
    expect(captionPlaceholder(periodFromKey("2026"))).toBe("what defined 2026");
  });

  it("is trimmed, at most 80 characters, and dropped when blank", () => {
    expect(CAPTION_MAX).toBe(80);
    expect(cleanCaption("  rooftop, finally  ")).toBe("rooftop, finally");
    expect(cleanCaption("   ")).toBeUndefined();
    expect(cleanCaption("")).toBeUndefined();
    expect(cleanCaption("x".repeat(95))).toBe("x".repeat(80));
    expect(cleanCaption("one\nline")).toBe("one line");
  });
});
