import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IntroClient } from "@/app/intro/intro-client";
import { HomePlaceholder } from "@/components/intro/home-placeholder";

// jsdom has no media playback, so stub what the hook touches.
let readyState = 0;
let playImpl: () => Promise<void> = () => Promise.resolve();
const pause = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  readyState = 0;
  playImpl = () => Promise.resolve();
  pause.mockClear();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => playImpl());
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);
  Object.defineProperty(HTMLMediaElement.prototype, "readyState", { configurable: true, get: () => readyState });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderIntro() {
  const home = (
    <HomePlaceholder
      desktop={{ src: "/your-circles-desktop.png", srcSet: "/your-circles-desktop.png 1x" }}
      mobile={{ src: "/your-circles.jpg", srcSet: "/your-circles.jpg 1x", width: 1170, height: 2532 }}
    />
  );
  const utils = render(<IntroClient home={home} />);
  const root = utils.container.querySelector("[data-intro]") as HTMLElement;
  const video = utils.container.querySelector("video:not([aria-hidden])") as HTMLVideoElement;
  return { ...utils, root, video };
}

describe("IntroClient", () => {
  it("plays the intro muted, inline, autoplaying (INTRO-1)", () => {
    const { video, root } = renderIntro();
    expect(video.getAttribute("src")).toBe("/intro-sunrise.mp4");
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(root.dataset.intro).toBe("playing");
  });

  it("tap anywhere skips with a fast cut (INTRO-3)", () => {
    const { root } = renderIntro();
    expect(screen.getByText("tap to skip")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(root.dataset.intro).toBe("done");
    expect(root.dataset.fast).toBe("true");
    expect(screen.queryByRole("button", { name: "Skip intro" })).toBeNull();
  });

  it("crossfades near the end and pauses the video (INTRO-2)", () => {
    const { root, video } = renderIntro();
    Object.defineProperty(video, "duration", { configurable: true, value: 5 });
    video.currentTime = 4.6;
    fireEvent.timeUpdate(video);
    expect(root.dataset.intro).toBe("done");
    expect(root.dataset.fast).toBe("false");
    expect(pause).toHaveBeenCalled();
  });

  it("goes home on a video error (INTRO-4)", () => {
    const { root, video } = renderIntro();
    fireEvent.error(video);
    expect(root.dataset.intro).toBe("done");
  });

  it("goes home when play() is rejected (INTRO-4)", async () => {
    playImpl = () => Promise.reject(new Error("NotAllowedError"));
    const { root } = renderIntro();
    await act(async () => {});
    expect(root.dataset.intro).toBe("done");
  });

  it("goes home if not loaded after 4s (INTRO-4)", () => {
    const { root } = renderIntro();
    act(() => vi.advanceTimersByTime(3999));
    expect(root.dataset.intro).toBe("playing");
    act(() => vi.advanceTimersByTime(1));
    expect(root.dataset.intro).toBe("done");
  });

  it("keeps playing at 4s if the video has loaded (INTRO-4)", () => {
    const { root } = renderIntro();
    readyState = 2;
    act(() => vi.advanceTimersByTime(4000));
    expect(root.dataset.intro).toBe("playing");
  });

  it("uses reduced-motion fade durations (INTRO-6)", () => {
    const { video } = renderIntro();
    expect(video.className).toContain("motion-reduce:duration-200");
  });

  it("art-directs the home placeholder at 768px (INTRO-7)", () => {
    const { container } = renderIntro();
    const source = container.querySelector("picture source") as HTMLSourceElement;
    expect(source.getAttribute("media")).toBe("(min-width: 768px)");
    expect(source.getAttribute("srcset")).toContain("/your-circles-desktop.png");
    const img = container.querySelector("picture img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/your-circles.jpg");
    expect(img.className).toContain("object-cover");
  });

  it("shows the whole desktop image over a blurred copy at md and up (INTRO-9)", () => {
    const { container } = renderIntro();
    const img = container.querySelector("picture img") as HTMLImageElement;
    expect(img.className).toContain("md:object-contain");
    const backdrop = container.querySelector("img[aria-hidden='true']") as HTMLImageElement;
    expect(backdrop.getAttribute("src")).toBe("/your-circles-desktop.png");
    expect(backdrop.getAttribute("alt")).toBe("");
    expect(backdrop.className).toMatch(/\bhidden\b/);
    expect(backdrop.className).toContain("md:block");
    expect(backdrop.className).toContain("blur-2xl");
    expect(backdrop.className).toContain("brightness-50");
    // The backdrop sits behind the sharp image.
    expect(backdrop.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("has a decorative backdrop video shown only at md and up (INTRO-8)", () => {
    const { container } = renderIntro();
    const backdrop = container.querySelector("video[aria-hidden='true']") as HTMLVideoElement;
    expect(backdrop.getAttribute("src")).toBe("/intro-sunrise.mp4");
    expect(backdrop.className).toMatch(/\bhidden\b/);
    expect(backdrop.className).toContain("md:block");
  });
});
