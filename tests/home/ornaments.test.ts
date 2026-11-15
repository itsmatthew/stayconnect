import { describe, expect, it } from "vitest";
import { ME } from "@/app/intro/messages/conversations";
import {
  CAPTION_MAX,
  canUndo,
  changedLine,
  normalizeCaption,
  ornamentKey,
  ornamentReducer,
  unreachableImages,
  withOrnaments,
  type OrnamentState,
} from "@/app/intro/ornaments/ornaments";
import { placeholderGroups } from "@/app/intro/placeholder-data";

const AT = new Date(2026, 9, 21, 12).getTime();
const hoops = "hoops-since-14";
const key = ornamentKey(hoops, 0);
const change = (state: OrnamentState, caption: string, photoId?: string, by = ME, at = AT) =>
  ornamentReducer(state, { type: "change", groupId: hoops, index: 0, photoId, caption, by, at });
const undo = (state: OrnamentState) => ornamentReducer(state, { type: "undo", groupId: hoops, index: 0 });

describe("changing an ornament (HOME-15/17)", () => {
  it("replaces its photo and caption, records who and when, and keeps the original to undo to", () => {
    const s = change({}, "new caption", "p1");
    expect(s[key].current).toEqual({ photoId: "p1", caption: "new caption", by: ME, at: AT });
    expect(s[key].previous).toBe("original");
    expect(canUndo(s, hoops, 0)).toBe(true);
  });

  it("a second change keeps the first as the version to undo to", () => {
    const s = change(change({}, "one", "p1"), "two", "p2", "leo", AT + 1);
    expect(s[key].current).toEqual({ photoId: "p2", caption: "two", by: "leo", at: AT + 1 });
    expect(s[key].previous).toEqual({ photoId: "p1", caption: "one", by: ME, at: AT });
  });

  it("leaves every other ornament alone", () => {
    const s = change({}, "x", "p1");
    expect(Object.keys(s)).toEqual([key]);
  });
});

describe("captions (HOME-14)", () => {
  it("are trimmed, one line, at most 40 characters, and blank means none", () => {
    expect(CAPTION_MAX).toBe(40);
    expect(normalizeCaption("  the 6am\n run  ")).toBe("the 6am run");
    expect(normalizeCaption("x".repeat(50))).toBe("x".repeat(40));
    expect(normalizeCaption("   ")).toBe("");
    expect(change({}, "  hi  ", "p1")[key].current.caption).toBe("hi");
  });

  it("a caption-only change keeps the photo", () => {
    const s = change(change({}, "one", "p1"), "renamed");
    expect(s[key].current.photoId).toBe("p1");
    expect(s[key].current.caption).toBe("renamed");
  });

  it("a caption-only change to an untouched ornament keeps its art", () => {
    const s = change({}, "renamed");
    expect(s[key].current.photoId).toBeUndefined();
  });
});

describe("undo (HOME-17)", () => {
  it("restores the previous version, one level only", () => {
    const s = undo(change(change({}, "one", "p1"), "two", "p2", "leo"));
    expect(s[key].current).toEqual({ photoId: "p1", caption: "one", by: ME, at: AT });
    expect(canUndo(s, hoops, 0)).toBe(false);
    expect(undo(s)).toBe(s);
  });

  it("undoing the first change brings back the original", () => {
    const s = undo(change({}, "one", "p1"));
    expect(s[key]).toBeUndefined();
    const [g] = withOrnaments(placeholderGroups, s, {}).filter((x) => x.id === hoops);
    expect(g.memories[0]).toEqual(placeholderGroups.find((x) => x.id === hoops)!.memories[0]);
  });

  it("does nothing to an ornament nobody changed", () => {
    const s: OrnamentState = {};
    expect(undo(s)).toBe(s);
    expect(canUndo(s, hoops, 0)).toBe(false);
  });

  it("deletes images that can no longer be restored", () => {
    const one = change({}, "one", "p1");
    const two = change(one, "two", "p2");
    const three = change(two, "three", "p3");
    expect(unreachableImages(two, three)).toEqual(["p1"]);
    expect(unreachableImages(three, undo(three))).toEqual(["p3"]);
    expect(unreachableImages(one, change(one, "renamed"))).toEqual([]);
  });
});

describe("the group sees it (HOME-15)", () => {
  it("withOrnaments changes only that group's ornament, with the photo's URL", () => {
    const s = change({}, "new caption", "p1");
    const out = withOrnaments(placeholderGroups, s, { p1: "blob:p1" });
    const g = out.find((x) => x.id === hoops)!;
    const original = placeholderGroups.find((x) => x.id === hoops)!;
    expect(g.memories[0]).toEqual({ ...original.memories[0], caption: "new caption", src: "blob:p1" });
    expect(g.memories.slice(1)).toEqual(original.memories.slice(1));
    for (const other of out.filter((x) => x.id !== hoops)) expect(other).toBe(placeholderGroups.find((x) => x.id === other.id));
  });
});

describe("who changed it (HOME-16)", () => {
  const nameOf = (id: string) => ({ leo: "Leo" })[id];
  const now = new Date(2026, 9, 22).getTime();

  it("names the user as You and friends by name, with the date", () => {
    expect(changedLine({ caption: "", by: ME, at: AT }, nameOf, now)).toBe("You changed this · Oct 21");
    expect(changedLine({ caption: "", by: "leo", at: AT }, nameOf, now)).toBe("Leo changed this · Oct 21");
  });

  it("adds the year when it isn't the current one", () => {
    const lastYear = new Date(2025, 9, 21).getTime();
    expect(changedLine({ caption: "", by: "leo", at: lastYear }, nameOf, now)).toBe("Leo changed this · Oct 21, 2025");
  });
});
