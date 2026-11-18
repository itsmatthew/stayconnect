import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { FramedPhoto } from "@/components/gifts/framed-photo";
import { GiftCard, type GiftCardLook } from "@/components/gifts/gift-card";
import { Postcard } from "@/components/gifts/postcard";
import { WrappedGift } from "@/components/gifts/wrapped-gift";

afterEach(cleanup);

const look: GiftCardLook = {
  to: "Maya",
  signature: "Harry",
  src: "blob:p",
  alt: "A photo",
  frame: "classic",
  stamp: { code: "11 05 '26", written: "Nov 5, 2026" },
  note: { text: "Miss you guys.", placeholder: "Something only Maya would get…", hand: "pen", ink: "#2B3350", stamp: "tree", postmark: "NOV 6 2026" },
  wrap: { pattern: "candy", ribbon: "#E8B93A", opens: undefined },
};

describe("frames (GIFT-6)", () => {
  it.each(["classic", "instant", "album", "film", "wood", "month"])("%s shows the photo", (frame) => {
    const { container } = render(<FramedPhoto src="blob:p" alt="A photo" frame={frame} />);
    expect(container.querySelector(`[data-frame="${frame}"]`)).toBeTruthy();
    expect(screen.getByRole("img", { name: "A photo" }).getAttribute("src")).toBe("blob:p");
  });

  it("prints the date stamp on the photo, and only with the stamp on", () => {
    const { rerender } = render(<FramedPhoto src="blob:p" alt="" frame="classic" stamp={look.stamp} />);
    expect(screen.getByText("11 05 '26")).toBeTruthy();
    rerender(<FramedPhoto src="blob:p" alt="" frame="classic" />);
    expect(screen.queryByText("11 05 '26")).toBeNull();
  });

  it("writes the date under an Instant photo", () => {
    render(<FramedPhoto src="blob:p" alt="" frame="instant" written={{ text: "Nov 5, 2026", hand: "pen", ink: "#2B3350" }} />);
    expect(screen.getByText("Nov 5, 2026")).toBeTruthy();
  });

  it("shows a waiting frame with no photo", () => {
    render(<FramedPhoto alt="" frame="classic" />);
    expect(screen.getByText("Your photo goes here")).toBeTruthy();
  });
});

describe("postcard (GIFT-7)", () => {
  it("shows the note, signature, address and printed footer", () => {
    const { container } = render(<Postcard to="Maya" signature="Harry" note={look.note} />);
    const text = container.textContent!;
    for (const part of ["Miss you guys.", "— Harry", "Maya", "wherever they are", "Now & Then · Post card"]) expect(text).toContain(part);
    expect(text).not.toContain("tree");
    expect(container.querySelector('[data-stamp="tree"]')).toBeTruthy();
  });

  it("writes in the chosen ink", () => {
    render(<Postcard to="Maya" signature="Harry" note={{ ...look.note, ink: "#B43A2A" }} />);
    expect(screen.getByText("Miss you guys.").style.color).toBe("rgb(180, 58, 42)");
  });

  it("leaves off the signature when there's no name", () => {
    const { container } = render(<Postcard to="Maya" signature="" note={look.note} />);
    expect(container.textContent).not.toContain("—");
  });
});

describe("wrapped gift (GIFT-8)", () => {
  it.each(["candy", "dots", "kraft", "gingham", "newsprint", "stars"])("%s draws its paper as an SVG pattern", (pattern) => {
    const { container } = render(<WrappedGift to="Maya" pattern={pattern} ribbon="#E8B93A" />);
    expect(container.querySelector(`[data-pattern="${pattern}"] pattern`)).toBeTruthy();
  });

  it("ties the tag, with the day when there is one", () => {
    const { container, rerender } = render(<WrappedGift to="Maya" pattern="candy" ribbon="#E8B93A" />);
    expect(container.textContent).toContain("to Maya");
    expect(container.textContent).not.toContain("open");
    rerender(<WrappedGift to="Maya" pattern="candy" ribbon="#E8B93A" opens="Nov 12" />);
    expect(container.textContent).toContain("open Nov 12");
  });

  it("reads to the group, and keeps a long name on the tag", () => {
    const name = "Long Name For A Friend Group We Have Now";
    const { container } = render(<WrappedGift to={name} pattern="candy" ribbon="#E8B93A" />);
    const lines = [...container.querySelectorAll("[data-tag-line]")].map((l) => l.textContent);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(`to ${name}`);
  });

  it("uses the ribbon color", () => {
    const { container } = render(<WrappedGift to="Maya" pattern="candy" ribbon="#C8432B" />);
    expect(container.querySelector("[data-ribbon]")!.getAttribute("fill")).toBe("#C8432B");
  });
});

describe("the card (GIFT-3)", () => {
  it("wraps the card itself, with nothing to turn over", () => {
    const { container } = render(<GiftCard look={look} side="wrapped" onFlip={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[data-flip] [data-side='photo']")).toBeTruthy();
    expect(container.querySelector("[data-pattern]")).toBeTruthy();
  });

  it("offers the other side, and hides the side you can't see", () => {
    const onFlip = vi.fn();
    const { container, rerender } = render(<GiftCard look={look} side="photo" onFlip={onFlip} />);
    fireEvent.click(screen.getByRole("button", { name: "turn it over" }));
    expect(onFlip).toHaveBeenCalled();
    expect(container.querySelector("[data-side='postcard']")!.getAttribute("aria-hidden")).toBe("true");
    rerender(<GiftCard look={look} side="postcard" onFlip={onFlip} />);
    expect(screen.getByRole("button", { name: "see the photo" })).toBeTruthy();
    expect(container.querySelector("[data-side='photo']")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("bobs, and flips with transforms that exist in React Native, instant under reduced motion", () => {
    const { container } = render(<GiftCard look={look} side="postcard" onFlip={() => {}} />);
    expect(container.querySelector<HTMLElement>("[data-flip]")!.style.transform).toContain("rotateY(180deg)");
    const css = readFileSync(path.join(__dirname, "../../src/components/gifts/gifts.css"), "utf8");
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*gf-flip/);
    expect(container.querySelector(".gf-float")).toBeTruthy();
  });
});

describe("portable looks (flagged for React Native)", () => {
  const dir = path.join(__dirname, "../../src/components/gifts");
  it.each(readdirSync(dir).filter((f) => /\.(tsx|css)$/.test(f)))("%s uses no CSS filter, blend mode, repeating gradient or backdrop blur", (file) => {
    const source = readFileSync(path.join(dir, file), "utf8");
    expect(source).not.toMatch(/\bfilter:|backdropFilter|backdrop-filter|mixBlendMode|mix-blend|repeating-(linear|radial)-gradient/);
  });
});

describe("views stay pure", () => {
  it("import nothing from the app", () => {
    const dir = path.join(__dirname, "../../src/components/gifts");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".tsx"))) expect(readFileSync(path.join(dir, f), "utf8")).not.toMatch(/@\/app|\.\.\/\.\.\/app/);
  });
});

