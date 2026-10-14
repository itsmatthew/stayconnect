import { describe, it, expect } from "vitest";
import { initialIntro, introReducer, NEAR_END_S } from "@/app/intro/intro-sequence";

describe("introReducer", () => {
  it("stays playing mid-video", () => {
    expect(introReducer(initialIntro, { type: "progress", currentTime: 2, duration: 5 }).phase).toBe("playing");
  });

  it("crossfades slowly near the end (INTRO-2)", () => {
    const s = introReducer(initialIntro, { type: "progress", currentTime: 5 - NEAR_END_S + 0.01, duration: 5 });
    expect(s).toEqual({ phase: "done", fast: false });
  });

  it("crossfades slowly on ended (INTRO-2)", () => {
    expect(introReducer(initialIntro, { type: "ended" })).toEqual({ phase: "done", fast: false });
  });

  it("ignores progress with unknown duration", () => {
    expect(introReducer(initialIntro, { type: "progress", currentTime: 0, duration: NaN }).phase).toBe("playing");
  });

  it.each(["skip", "error", "playRejected"] as const)("%s cuts fast (INTRO-3/4)", (type) => {
    expect(introReducer(initialIntro, { type })).toEqual({ phase: "done", fast: true });
  });

  it("load timeout only fires if the video hasn't loaded (INTRO-4)", () => {
    expect(introReducer(initialIntro, { type: "loadTimeout", readyState: 0 })).toEqual({ phase: "done", fast: true });
    expect(introReducer(initialIntro, { type: "loadTimeout", readyState: 2 }).phase).toBe("playing");
  });

  it("finishes once (INTRO-5)", () => {
    const done = introReducer(initialIntro, { type: "ended" });
    expect(introReducer(done, { type: "skip" })).toBe(done);
  });
});
