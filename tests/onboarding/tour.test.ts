import { describe, expect, it } from "vitest";
import { STOPS, TOUR_DELAY_MS, TOUR_STOPS, startTour, tourReducer, tourView, type TourState } from "@/app/intro/onboarding/tour";

const run = (...actions: Parameters<typeof tourReducer>[1][]) => actions.reduce((s, a) => tourReducer(s, a), startTour());

describe("the stops (ONB-15)", () => {
  it("web runs nine of the design's eleven, skipping the Me profile stops for now", () => {
    expect(STOPS).toHaveLength(11);
    expect(TOUR_STOPS.map((s) => s.title)).toEqual([
      "Your tree’s planted",
      "Daily 5",
      "From back whenever",
      "Send one",
      "65 Archive",
      "Everyone’s picks",
      "Your circle’s chat",
      "Pin your people",
      "Your year",
    ]);
  });

  it("the Daily 5 stop is written for photos you add", () => {
    expect(TOUR_STOPS[1].body).toBe("Every morning it picks five of your photos from at least a year ago. Add yours here to see your first five.");
  });
});

describe("walking the tour (ONB-16, ONB-17)", () => {
  it("starts on Home, spotlighting the Daily 5 tab", () => {
    const v = tourView(startTour())!;
    expect(v).toMatchObject({ kind: "stop", tab: "Circles", targets: ["nav:Daily 5"], title: "Your tree’s planted", count: "1 of 9", tap: { label: "Go to Daily 5", hint: "Tap Daily 5", to: "Daily 5" } });
  });

  it("tapping the tab opens Daily 5's first stop, with Got it", () => {
    const v = tourView(run({ type: "tap" }))!;
    expect(v).toMatchObject({ kind: "stop", tab: "Daily 5", title: "Daily 5", count: "2 of 9", tap: undefined });
  });

  it("Got it on a stop moves to the next one", () => {
    expect(tourView(run({ type: "tap" }, { type: "gotIt" }))).toMatchObject({ title: "From back whenever", count: "3 of 9" });
  });

  it("the last stop of a tab, after Got it, points at the next tab", () => {
    const atSend = run({ type: "tap" }, { type: "gotIt" }, { type: "gotIt" });
    expect(tourView(atSend)).toMatchObject({ title: "Send one", tap: undefined });
    const up = tourView(tourReducer(atSend, { type: "gotIt" }))!;
    expect(up).toMatchObject({ tab: "Daily 5", targets: ["nav:Archive"], title: "Up next: Archive", body: "See the photo of the week.", count: "4 of 9", tap: { hint: "Tap Archive", to: "Archive" } });
    expect(tourView(tourReducer(tourReducer(atSend, { type: "gotIt" }), { type: "tap" }))).toMatchObject({ tab: "Archive", title: "65 Archive", count: "5 of 9" });
  });

  it("Got it does nothing where a tap is needed, and a tap nothing where Got it is", () => {
    const s = startTour();
    expect(tourReducer(s, { type: "gotIt" })).toEqual(s);
    const d5 = run({ type: "tap" });
    expect(tourReducer(d5, { type: "tap" })).toEqual(d5);
  });

  it("walks every tab and ends on Circles with You're all set (ONB-18)", () => {
    let s: TourState = startTour();
    const seen: string[] = [];
    for (let i = 0; i < 40 && tourView(s)?.kind === "stop"; i++) {
      const v = tourView(s)!;
      if (v.kind === "stop") seen.push(`${v.tab}:${v.title}`);
      s = tourReducer(s, { type: v.kind === "stop" && v.tap ? "tap" : "gotIt" });
    }
    expect(seen.at(-1)).toBe("Me:Up next: Circles");
    expect(seen.filter((t) => t.includes("Up next"))).toEqual(["Daily 5:Up next: Archive", "Archive:Up next: Messages", "Messages:Up next: Me", "Me:Up next: Circles"]);
    expect(tourView(s)).toEqual({
      kind: "done",
      tab: "Circles",
      title: "You’re all set",
      body: "Tap a + on your tree to add your 3 ornaments. Everything else is one tap away down here.",
    });
    expect(tourView(tourReducer(s, { type: "end" }))).toBeNull();
  });

  it("no tour, nothing to show", () => {
    expect(tourView(null)).toBeNull();
  });
});

describe("when it starts (ONB-14)", () => {
  it("a moment after Go to my circle: 2.2 s", () => {
    expect(TOUR_DELAY_MS).toBe(2200);
  });
});

describe("the tour for invited friends (ONB-22)", () => {
  it("ends pointing at the letter waiting in your mailbox", () => {
    let s: TourState = startTour({ joined: "Red Robin" });
    for (let i = 0; i < 40 && tourView(s)?.kind === "stop"; i++) {
      const v = tourView(s)!;
      s = tourReducer(s, { type: v.kind === "stop" && v.tap ? "tap" : "gotIt" });
    }
    expect(tourView(s)).toMatchObject({ kind: "done", title: "You’re all set", body: "Red Robin is on your tree now. Check your mailbox, there’s a letter waiting for you." });
  });
});
