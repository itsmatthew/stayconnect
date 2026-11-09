// Pins what the design (design-ref/project/GiftCompose.dc.html, MeGifts.dc.html) specifies, where jsdom can see it.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { FRAMES, HANDS, INKS, RIBBONS, STAMPS, WRAPS } from "@/app/intro/gifts/gift-catalog";
import { monthFrameLabel, stampCode } from "@/app/intro/gifts/gift";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { FramedPhoto } from "@/components/gifts/framed-photo";
import { Postcard } from "@/components/gifts/postcard";
import { WrappedGift } from "@/components/gifts/wrapped-gift";

const NOW = new Date(2026, 10, 6, 12).getTime();
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `design-${++n}`;
});
afterEach(cleanup);

const read = (p: string) => readFileSync(path.join(__dirname, "../..", p), "utf8");
const renderMe = () =>
  render(
    <AppClient initialTab="Me" data={demoData} now={() => NOW} openStore={() => openPhotoStore(`${dbName}-p`)} openArchive={() => openArchiveStore(`${dbName}-a`)} openOrnaments={() => openOrnamentStore(dbName)} hasFace={async () => true} />,
  );

describe("catalog matches the design's names and colors", () => {
  it("frames, with the design's notes", () => {
    expect(FRAMES.map((f) => [f.label, f.blurb])).toEqual([
      ["Classic", "clean white border"],
      ["Instant", "room to write the date"],
      ["Album", "tucked into photo corners"],
      ["Film", "one frame off the roll"],
      ["Wood", "framed like it’s on a shelf"],
      ["November", "changes with the month"],
    ]);
  });

  it("handwriting, inks, stamps, papers and ribbons", () => {
    expect(HANDS.map((h) => h.label)).toEqual(["Pen", "Pencil", "Script"]);
    expect(INKS.map((i) => [i.label, i.color])).toEqual([
      ["Navy", "#2B3350"],
      ["Red", "#A8331F"],
      ["Green", "#3E6B2C"],
      ["Graphite", "#5A5B61"],
    ]);
    expect(STAMPS.map((t) => t.label)).toEqual(["Tree", "Sunrise", "365", "Heart"]);
    expect(WRAPS.map((w) => w.label)).toEqual(["Candy stripe", "Gold dots", "Kraft", "Gingham", "Newsprint", "Night sky"]);
    expect(RIBBONS.map((r) => [r.label, r.color])).toEqual([
      ["Gold", "#F2BE4A"],
      ["Red", "#C8402D"],
      ["Cream", "#F4EFE6"],
      ["Navy", "#2B3350"],
    ]);
  });

  it("the month frame is named for the month it's sent in", () => {
    expect(monthFrameLabel(NOW)).toBe("November");
    expect(monthFrameLabel(new Date(2026, 11, 2).getTime())).toBe("December");
  });
});

describe("fonts", () => {
  it("loads Pencil's Reenie Beanie and the date stamp's VT323, and Caveat at 600", () => {
    const page = read("src/app/intro/page.tsx");
    expect(page).toMatch(/Reenie_Beanie/);
    expect(page).toMatch(/VT323/);
    expect(page).toMatch(/Caveat\(\{[^)]*"600"/);
    expect(page).not.toMatch(/Shadows_Into_Light/);
  });
});

describe("frames and stamp", () => {
  it("prints the date stamp as old cameras did: MM DD 'YY in VT323 orange", () => {
    expect(stampCode(new Date(2026, 10, 5).getTime())).toBe("11 05 '26");
    render(<FramedPhoto src="blob:p" alt="" frame="classic" stamp={{ code: "11 05 '26", written: "Nov 5, 2026" }} />);
    const s = screen.getByText("11 05 '26");
    expect(s.style.fontFamily).toContain("VT323");
    expect(s.style.color).toBe("rgb(255, 154, 60)");
  });

  it("writes Instant's date in the note's hand and ink, whether or not the stamp is on", () => {
    render(<FramedPhoto src="blob:p" alt="" frame="instant" written={{ text: "Nov 5, 2026", hand: "pencil", ink: "#A8331F" }} />);
    const d = screen.getByText("Nov 5, 2026");
    expect(d.style.fontFamily).toContain("gift-pencil");
    expect(d.style.color).toBe("rgb(168, 51, 31)");
  });

  it("draws the month frame's leaves and its caption", () => {
    const { container } = render(<FramedPhoto src="blob:p" alt="" frame="month" monthCaption="November '26" />);
    expect(container.querySelector("[data-leaves]")).toBeTruthy();
    expect(screen.getByText("November '26")).toBeTruthy();
  });
});

describe("postcard", () => {
  const note = { text: "", placeholder: "Something only Maya would get…", hand: "pen", ink: "#2B3350", stamp: "sunrise", postmark: "NOV 6 2026" };

  it("signs with an em dash and shows the placeholder faintly when empty", () => {
    const { container } = render(<Postcard to="Maya" signature="Harry" note={note} />);
    expect(container.textContent).toContain("— Harry");
    expect(screen.getByText("Something only Maya would get…").style.opacity).toBe("0.4");
  });

  it("has a tilted postmark with cancel lines, and three address lines", () => {
    const { container } = render(<Postcard to="Maya" signature="Harry" note={note} />);
    expect(container.querySelector<SVGElement>("[data-postmark]")!.style.transform).toContain("rotate(-12deg)");
    expect(container.querySelector("[data-postmark] [data-cancel]")).toBeTruthy();
    expect(container.querySelectorAll("[data-address-line]")).toHaveLength(3);
  });
});

describe("wrapping", () => {
  it("has a notched kraft tag and moves in the design's order", () => {
    const { container } = render(<WrappedGift to="Maya" pattern="candy" ribbon="#F2BE4A" opens="Nov 12" />);
    expect(container.querySelector("[data-tag] polygon")).toBeTruthy();
    const classes = [...container.querySelectorAll("[class]")].map((el) => el.getAttribute("class"));
    for (const c of ["gf-paper-l", "gf-paper-r", "gf-ribbon-v", "gf-ribbon-h", "gf-bow", "gf-tag"]) expect(classes).toContain(c);
  });

  it("turns every animation off under reduced motion", () => {
    const css = read("src/components/gifts/gifts.css");
    const reduced = css.slice(css.indexOf("prefers-reduced-motion"));
    for (const c of ["gf-float", "gf-paper-l", "gf-bow", "gf-tag", "gf-sheet", "gf-pull"]) expect(reduced).toContain(c);
  });
});

describe("the shelf and the drawer", () => {
  it("shows the cabinet's six cubbies and the drawer, with no text when empty", () => {
    renderMe();
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    const shelf = screen.getByRole("region", { name: "Your shelf" });
    expect(shelf.querySelectorAll("[data-cubby]")).toHaveLength(6);
    expect(within(shelf).getByRole("button", { name: "send a gift" })).toBeTruthy();
    expect(shelf.textContent).toBe("send a gift");
  });

  it("pulls the drawer, then slides the gift maker up over the shelf", async () => {
    // Full motion: jsdom has no matchMedia, which the app reads as reduced motion.
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    renderMe();
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    const drawer = screen.getByRole("button", { name: "send a gift" });
    fireEvent.click(drawer);
    expect(drawer.className).toContain("gf-pull");
    const sheet = await screen.findByRole("dialog");
    expect(sheet.className).toContain("gf-sheet");
    vi.unstubAllGlobals();
  });

  it("skips the pull under reduced motion, and opens at once", () => {
    renderMe();
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    fireEvent.click(screen.getByRole("button", { name: "send a gift" }));
    return screen.findByRole("dialog");
  });

  it("keeps the pills 32px tall to look at, 44px to tap", () => {
    renderMe();
    for (const name of ["posts", "gifts", "Year, 2026"]) {
      const pill = screen.getByRole("button", { name });
      expect(pill.style.minHeight).toBe("44px");
      expect((pill.firstElementChild as HTMLElement).style.height).toBe("calc(32 * var(--s))");
    }
  });
});

describe("the maker's layout", () => {
  const open = async () => {
    renderMe();
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    fireEvent.click(screen.getByRole("button", { name: "send a gift" }));
    return screen.findByRole("dialog");
  };

  it("closes with the design's words", async () => {
    await open();
    expect(screen.getByRole("button", { name: "Cancel and go back to your gifts" }).style.minHeight).toBe("44px");
  });

  it("puts the search behind a magnifier, as designed", async () => {
    await open();
    expect(screen.queryByRole("searchbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Search friends" }));
    expect(screen.getByRole("searchbox", { name: "Search people" })).toBeTruthy();
  });

  it("scrolls inside the panel, so Back and Next never leave the screen", async () => {
    await open();
    const panel = document.querySelector<HTMLElement>("[data-gift-panel]")!;
    expect(panel.style.overflowY).toBe("auto");
    const next = screen.getByRole("button", { name: /^Next: photo/ });
    expect(panel.contains(next)).toBe(false);
  });
});
