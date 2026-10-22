import { describe, expect, it } from "vitest";
import { ME } from "@/app/intro/messages/conversations";
import { LOGO, canUndo, changedLine, ornamentKey, ornamentReducer, unreachableImages, withOrnaments, type OrnamentState } from "@/app/intro/ornaments/ornaments";
import { groupParty, recipientSections } from "@/app/intro/parties";
import { placeholderGroups } from "@/app/intro/placeholder-data";

const AT = new Date(2026, 9, 21, 12).getTime();
const madrid = "madrid-crew";
const key = ornamentKey(madrid, LOGO);
const change = (state: OrnamentState, photoId: string, by = ME, at = AT) =>
  ornamentReducer(state, { type: "change", groupId: madrid, index: LOGO, photoId, caption: "", by, at });
const undo = (state: OrnamentState) => ornamentReducer(state, { type: "undo", groupId: madrid, index: LOGO });
const madridOf = (s: OrnamentState, urls: Record<string, string> = {}) => withOrnaments(placeholderGroups, s, urls).find((g) => g.id === madrid)!;

describe("changing the logo (LOGO-4/6)", () => {
  it("is its own slot next to the ornaments", () => {
    const s = change({}, "l1");
    expect(Object.keys(s)).toEqual([key]);
    expect(s[key].current).toEqual({ photoId: "l1", caption: "", by: ME, at: AT });
    expect(canUndo(s, madrid, LOGO)).toBe(true);
    expect(canUndo(s, madrid, 0)).toBe(false);
  });

  it("the group carries the logo's URL; its ornaments are untouched", () => {
    const g = madridOf(change({}, "l1"), { l1: "blob:l1" });
    const original = placeholderGroups.find((x) => x.id === madrid)!;
    expect(g.logo).toBe("blob:l1");
    expect(g.memories).toEqual(original.memories);
  });

  it("a group nobody changed has no logo image", () => {
    expect(madridOf({}).logo).toBeUndefined();
  });
});

describe("undo (LOGO-5)", () => {
  it("one level; undoing the first change brings back the initials", () => {
    const two = change(change({}, "l1"), "l2", "leo");
    const back = undo(two);
    expect(back[key].current.photoId).toBe("l1");
    expect(canUndo(back, madrid, LOGO)).toBe(false);
    expect(madridOf(undo(change({}, "l1")), { l1: "blob:l1" }).logo).toBeUndefined();
  });

  it("deletes logo images that can no longer be restored", () => {
    const two = change(change({}, "l1"), "l2");
    expect(unreachableImages(two, change(two, "l3"))).toEqual(["l1"]);
    expect(unreachableImages(two, undo(two))).toEqual(["l2"]);
  });
});

describe("who changed it (LOGO-5)", () => {
  const nameOf = (id: string) => ({ leo: "Leo" })[id];
  const now = new Date(2026, 9, 22).getTime();
  it("reads “changed the logo”", () => {
    expect(changedLine({ caption: "", by: "leo", at: AT }, nameOf, now, "the logo")).toBe("Leo changed the logo · Oct 21");
    expect(changedLine({ caption: "", by: ME, at: AT }, nameOf, now, "the logo")).toBe("You changed the logo · Oct 21");
    expect(changedLine({ caption: "", by: "leo", at: new Date(2025, 9, 21).getTime() }, nameOf, now, "the logo")).toBe("Leo changed the logo · Oct 21, 2025");
  });
});

describe("parties carry the logo (LOGO-1/2)", () => {
  it("initials always, the image once changed", () => {
    const g = madridOf(change({}, "l1"), { l1: "blob:l1" });
    expect(groupParty(g)).toMatchObject({ kind: "group", initials: "MC", logo: "blob:l1" });
    const fall = placeholderGroups.find((x) => x.name === "Fall 24")!;
    expect(groupParty(fall)).toMatchObject({ initials: "F24" });
    expect((groupParty(fall) as { logo?: string }).logo).toBeUndefined();
  });

  it("the send picker gets the changed logo", () => {
    const groups = withOrnaments(placeholderGroups, change({}, "l1"), { l1: "blob:l1" });
    const { closest } = recipientSections(groups, []);
    expect(closest.find((p) => p.name === "Madrid Crew")).toMatchObject({ logo: "blob:l1" });
  });
});
