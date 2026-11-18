import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { groupPalette } from "@/app/intro/colors/palette";
import { PartyAvatar } from "@/components/messages/avatar";

afterEach(cleanup);

describe("text on a group's color stays cream (COLOR-2)", () => {
  it("draws initials in cream", () => {
    render(<PartyAvatar party={{ kind: "group", id: "g", name: "Golds", closest: false, palette: groupPalette("amber", 0), initials: "G" }} size={56} />);
    expect(screen.getByRole("img", { name: "Golds logo" }).style.color).toBe("rgb(255, 246, 218)");
  });
});
