import { describe, expect, it } from "vitest";
import { circleLogoSvg, crestLetter, monogram } from "@/components/onboarding/circle-logo";
import { circleGroup, validCircles, withMyCircles } from "@/app/intro/onboarding/my-circles";
import { colorClash, inviteMessage, nameReady, startDraft, startReducer, type Draft } from "@/app/intro/onboarding/start-circle";

const NOW = new Date(2026, 10, 8, 9).getTime();
type D = Draft<string>;
const run = (d: D, ...actions: Parameters<typeof startReducer<string>>[1][]) => actions.reduce(startReducer<string>, d);

describe("the steps (ONB-7)", () => {
  it("starts on step 1 with the least-used color and the crest", () => {
    expect(startDraft<string>(["red", "orange"])).toEqual({ step: 1, name: "", colorId: "amber", logo: "crest" });
    expect(startDraft<string>([]).colorId).toBe("red");
  });

  it("goes forward, and back keeps what you entered", () => {
    const d = run(startDraft([]), { type: "name", name: "Red Robin" }, { type: "next" }, { type: "logo", logo: "badge" }, { type: "next" });
    expect(d.step).toBe(3);
    const back = run(d, { type: "back" }, { type: "back" });
    expect(back).toMatchObject({ step: 1, name: "Red Robin", logo: "badge" });
    expect(run(back, { type: "back" }).step).toBe(1);
  });

  it("the invite step moves on only once shared, and live is the end", () => {
    const at4 = run(startDraft([]), { type: "name", name: "x" }, { type: "next" }, { type: "next" }, { type: "next" });
    expect(at4.step).toBe(4);
    expect(run(at4, { type: "next" }).step).toBe(4);
    const live = run(at4, { type: "shared", how: "copied" });
    expect(live).toMatchObject({ step: 5, shared: "copied" });
    expect(run(live, { type: "back" }).step).toBe(5);
    expect(run(startDraft<string>([]), { type: "shared", how: "shared" }).step).toBe(1);
  });
});

describe("step 1: name and color (ONB-8)", () => {
  it("needs a letter or digit, and keeps 22 characters", () => {
    expect(nameReady("   ")).toBe(false);
    expect(nameReady("!!")).toBe(false);
    expect(nameReady(" Fall 24 ")).toBe(true);
    expect(run(startDraft([]), { type: "name", name: "  " }, { type: "next" }).step).toBe(1);
    expect(run(startDraft([]), { type: "name", name: "a".repeat(30) }).name).toHaveLength(22);
  });

  it("takes only the twelve group colors", () => {
    expect(run(startDraft([]), { type: "color", colorId: "teal" }).colorId).toBe("teal");
    expect(run(startDraft([]), { type: "color", colorId: "chartreuse" }).colorId).toBe("red");
  });

  it("says which circle already has the color, and the shade yours gets", () => {
    const mine = [{ id: "a", name: "Madrid Crew", colorId: "red", joinedAt: 1 }];
    expect(colorClash("red", mine, NOW)).toEqual({ name: "Madrid Crew", shade: 1 });
    expect(colorClash("blue", mine, NOW)).toBeUndefined();
    expect(colorClash("red", [], NOW)).toBeUndefined();
  });
});

describe("step 2: logo (ONB-9)", () => {
  it("makes a monogram from the first two words, or two characters", () => {
    expect(monogram("Red Robin")).toBe("RR");
    expect(monogram("Family")).toBe("FA");
    expect(monogram("Hoops Since ’14")).toBe("HS");
    expect(monogram("   ")).toBe("?");
    expect(crestLetter("lake week")).toBe("L");
  });

  it("draws each style in the circle's color, escaping the name", () => {
    expect(circleLogoSvg("crest", "Red Robin", "#C8432B", 2026)).toContain(">R</text>");
    expect(circleLogoSvg("badge", "Red Robin", "#C8432B", 2026)).toContain("EST · 2026");
    expect(circleLogoSvg("varsity", "Red Robin", "#C8432B", 2026)).toContain('fill="#C8432B"');
    expect(circleLogoSvg("badge", "<b> &", "#C8432B", 2026)).not.toContain("<b>");
  });
});

describe("step 4: the invite (ONB-11)", () => {
  it("sends the designed message", () => {
    expect(inviteMessage(" Red Robin ")).toBe("saved you a spot on our tree 🌲 come join Red Robin");
  });
});

describe("your new circle (ONB-13)", () => {
  const c = { id: "c1", name: "Red Robin", colorId: "red", createdAt: NOW };

  it("is a group with you as its only member", () => {
    expect(circleGroup(c)).toMatchObject({ id: "c1", name: "Red Robin", colorId: "red", joinedAt: NOW, members: [], friendCount: 1, closest: true });
    expect(circleGroup(c).palette.canopy).toBe("#C8432B");
  });

  it("comes first, newest first", () => {
    const older = { ...c, id: "c0", createdAt: NOW - 1 };
    const out = withMyCircles([{ id: "x" }], [older, c], (m) => ({ id: m.id }));
    expect(out.map((g) => g.id)).toEqual(["c1", "c0", "x"]);
  });

  it("drops damaged saves", () => {
    expect(validCircles([c, { id: 3 }, null])).toEqual([c]);
    expect(validCircles("nope")).toEqual([]);
  });
});
