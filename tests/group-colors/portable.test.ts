import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.join(__dirname, "../../src/app/intro/colors");
/** The two files allowed to know about the platform (COLOR-11). */
const PLATFORM = ["local-color-overrides.ts", "use-color-overrides.ts"];
const logicFiles = readdirSync(DIR).filter((f) => f.endsWith(".ts") && !PLATFORM.includes(f));

describe("portable (COLOR-11)", () => {
  it("has logic files to check", () => {
    expect(logicFiles).toEqual(expect.arrayContaining(["palette.ts", "group-colors.ts", "color-overrides.ts", "member-colors.ts"]));
  });

  it.each(logicFiles)("%s uses no React, browser APIs or app imports", (file) => {
    const source = readFileSync(path.join(DIR, file), "utf8");
    expect(source).not.toMatch(/from "(react|next|@\/)/);
    expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|navigator)\b/);
  });
});
