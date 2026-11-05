import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { groupPalette } from "@/app/intro/colors/palette";
import { PostCard } from "@/components/archive/post-card";
import type { PostCardView } from "@/components/archive/types";
import { PartyAvatar } from "@/components/messages/avatar";

afterEach(cleanup);

describe("text on a group's color stays cream (COLOR-2)", () => {
  it("draws initials on canopy and shade only, with no light spot under them", () => {
    const palette = groupPalette("amber", 2);
    render(<PartyAvatar party={{ kind: "group", id: "g", name: "Golds", closest: false, palette, initials: "G" }} size={56} />);
    const logo = screen.getByRole("img", { name: "Golds logo" });
    expect(logo.style.color).toBe("rgb(255, 246, 218)");
    expect(logo.getAttribute("style")).not.toContain(palette.highlight);
  });

  it("uses cream on post cards, whatever the color underneath", () => {
    const look = { skin: "#EDB98F", hair: "#6B3F23", shirt: "#2B3350", bg: "#CFE0F4", ring: "#3F9AD8" };
    const card: PostCardView = {
      id: "p",
      variant: "week",
      label: "Leo, Week 42",
      author: { name: "Leo", look },
      time: "Tuesday · 2:40 pm",
      outlines: [],
      // Lighter than any real shade: this is where the card used to switch to navy.
      palette: { canopy: "#FFE0A0", shade: "#FFE0A0", highlight: "#FFE0A0", rim: "#FFE0A0" },
      tags: [],
      moreTags: 0,
      photo: { kind: "art", art: "sunset", alt: "A sunset" },
    };
    render(<PostCard card={card} />);
    expect(screen.getByText("Leo").parentElement!.parentElement!.style.color).toBe("rgb(255, 246, 218)");
  });
});
