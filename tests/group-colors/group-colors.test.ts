import { describe, expect, it } from "vitest";
import { resolveColorsForViewer, suggestGroupColor, withViewerColors } from "@/app/intro/colors/group-colors";
import { fakeMemberColors } from "@/app/intro/colors/member-colors";
import { GROUP_COLORS, groupPalette } from "@/app/intro/colors/palette";

const ids = GROUP_COLORS.map((c) => c.id);
const group = (id: string, colorId: string, joinedAt: number) => ({ id, colorId, joinedAt });

describe("suggestGroupColor (COLOR-3)", () => {
  it("starts at the first color when nothing is used", () => {
    expect(suggestGroupColor([])).toBe(ids[0]);
  });

  it("picks a color no member uses", () => {
    expect(suggestGroupColor([ids[0], ids[1], ids[1]])).toBe(ids[2]);
  });

  it("finds the one free color", () => {
    const free = ids[7];
    expect(suggestGroupColor(ids.filter((c) => c !== free))).toBe(free);
  });

  it("picks the least-used color when none is free", () => {
    const leastUsed = ids[4];
    expect(suggestGroupColor([...ids, ...ids.filter((c) => c !== leastUsed)])).toBe(leastUsed);
  });

  it("breaks ties by palette order, whatever order the input is in", () => {
    expect(suggestGroupColor([...ids, ids[0]])).toBe(ids[1]);
    expect(suggestGroupColor([ids[0], ...[...ids].reverse()])).toBe(ids[1]);
  });

  it("ignores unknown colors", () => {
    expect(suggestGroupColor(["rust", "not-a-color"])).toBe(ids[0]);
  });
});

describe("member colors (COLOR-4)", () => {
  const source = fakeMemberColors({ ana: ["red", "blue"], leo: ["blue"] });

  it("returns every color the members use, repeats included", async () => {
    expect([...(await source.colorsUsedByMembers(["ana", "leo"]))].sort()).toEqual(["blue", "blue", "red"]);
  });

  it("returns nothing for members it doesn't know", async () => {
    expect(await source.colorsUsedByMembers(["zed"])).toEqual([]);
  });

  it("feeds suggestGroupColor", async () => {
    expect(suggestGroupColor(await source.colorsUsedByMembers(["ana"]))).toBe(ids.find((c) => c !== "red" && c !== "blue"));
  });
});

describe("resolveColorsForViewer (COLOR-5)", () => {
  it("gives groups with different colors their base shade", () => {
    expect(resolveColorsForViewer([group("a", "red", 1), group("b", "blue", 2)])).toEqual({
      a: { colorId: "red", shade: 0 },
      b: { colorId: "blue", shade: 0 },
    });
  });

  it("shifts a later group to another shade of the same color", () => {
    expect(resolveColorsForViewer([group("a", "red", 1), group("b", "red", 2), group("c", "red", 3)])).toEqual({
      a: { colorId: "red", shade: 0 },
      b: { colorId: "red", shade: 1 },
      c: { colorId: "red", shade: 2 },
    });
  });

  it("breaks a tie on join date by group id", () => {
    expect(resolveColorsForViewer([group("b", "red", 1), group("a", "red", 1)])).toEqual({
      a: { colorId: "red", shade: 0 },
      b: { colorId: "red", shade: 1 },
    });
  });

  it("never changes a group's color", () => {
    const groups = ids.flatMap((c, i) => [group(`${c}-1`, c, i), group(`${c}-2`, c, i + 100)]);
    const resolved = resolveColorsForViewer(groups);
    for (const g of groups) expect(resolved[g.id].colorId).toBe(g.colorId);
  });

  it("leaves out a group whose color isn't in the palette", () => {
    expect(resolveColorsForViewer([group("a", "rust", 1)])).toEqual({});
  });
});

describe("stable (COLOR-6)", () => {
  const groups = [group("a", "red", 3), group("b", "red", 1), group("c", "blue", 2), group("d", "red", 2)];

  it("doesn't depend on list order", () => {
    expect(resolveColorsForViewer([...groups].reverse())).toEqual(resolveColorsForViewer(groups));
  });

  it("doesn't shift existing groups when a new one is joined", () => {
    const before = resolveColorsForViewer(groups);
    const after = resolveColorsForViewer([...groups, group("0-sorts-first", "red", 9)]);
    for (const g of groups) expect(after[g.id]).toEqual(before[g.id]);
  });

  it("repeats shades past the third group, and keeps the color", () => {
    const four = [1, 2, 3, 4].map((n) => group(`g${n}`, "red", n));
    expect(resolveColorsForViewer(four).g4).toEqual({ colorId: "red", shade: 0 });
  });
});

describe("personal override (COLOR-7)", () => {
  it("recolors the group at the base shade", () => {
    expect(resolveColorsForViewer([group("a", "red", 1)], { a: "teal" }).a).toEqual({ colorId: "teal", shade: 0 });
  });

  it("wins over an earlier group, which shifts around it", () => {
    const resolved = resolveColorsForViewer([group("a", "teal", 1), group("b", "red", 2)], { b: "teal" });
    expect(resolved.b).toEqual({ colorId: "teal", shade: 0 });
    expect(resolved.a).toEqual({ colorId: "teal", shade: 1 });
  });

  it("frees the old color for the groups left in it", () => {
    const resolved = resolveColorsForViewer([group("a", "red", 1), group("b", "red", 2)], { a: "teal" });
    expect(resolved.b).toEqual({ colorId: "red", shade: 0 });
  });

  it("keeps the earlier-joined group first when two overrides pick one color", () => {
    const resolved = resolveColorsForViewer([group("a", "red", 2), group("b", "blue", 1)], { a: "teal", b: "teal" });
    expect(resolved.b.shade).toBe(0);
    expect(resolved.a.shade).toBe(1);
  });

  it("ignores an override to an unknown color, and one for a group the viewer isn't in", () => {
    expect(resolveColorsForViewer([group("a", "red", 1)], { a: "rust", gone: "red" })).toEqual({ a: { colorId: "red", shade: 0 } });
  });
});

describe("withViewerColors (COLOR-9)", () => {
  const palette = groupPalette("red", 0);

  it("puts each group's resolved shade on its palette", () => {
    const [a, b] = withViewerColors([{ ...group("a", "red", 1), palette }, { ...group("b", "red", 2), palette }], {});
    expect(a.palette).toEqual(groupPalette("red", 0));
    expect(b.palette).toEqual(groupPalette("red", 1));
  });

  it("keeps the shared colorId, so the override stays personal", () => {
    expect(withViewerColors([{ ...group("a", "red", 1), palette }], { a: "teal" })[0]).toMatchObject({ colorId: "red", palette: groupPalette("teal", 0) });
  });

  it("leaves a group with an unknown color as it was", () => {
    const g = { ...group("a", "rust", 1), palette };
    expect(withViewerColors([g], {})[0]).toBe(g);
  });
});
