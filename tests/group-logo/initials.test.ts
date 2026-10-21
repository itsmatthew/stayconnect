import { describe, expect, it } from "vitest";
import { logoInitials } from "@/app/intro/logos/initials";

describe("default logo initials (LOGO-1)", () => {
  it.each([
    ["Madrid Crew", "MC"],
    ["Fall 24", "F24"],
    ["Apt 4B", "A4B"],
    ["Hoops Since ’14", "HS"],
    ["Hoops Since '14", "HS"],
    ["Family", "F"],
    ["Uni Mates", "UM"],
    ["Friends From Old College", "FFO"],
  ])("%s → %s", (name, initials) => {
    expect(logoInitials(name)).toBe(initials);
  });

  it("never splits a number: a word that doesn't fit is skipped", () => {
    expect(logoInitials("Class of 2024")).toBe("CO");
    expect(logoInitials("Team 1234 Rocks")).toBe("TR");
    expect(logoInitials("Apt 4B Crew")).toBe("A4B");
  });

  it("upper-cases and ignores extra spaces", () => {
    expect(logoInitials("  madrid   crew ")).toBe("MC");
    expect(logoInitials("apt 4b")).toBe("A4B");
  });

  it("falls back to the first letter or digit when nothing fits", () => {
    expect(logoInitials("2024")).toBe("2");
    expect(logoInitials("’14")).toBe("1");
  });

  it("is never more than 3 characters", () => {
    for (const name of ["A B C D E", "12 34 56", "Fall 24 Crew Mates"]) expect(logoInitials(name).length).toBeLessThanOrEqual(3);
  });
});
