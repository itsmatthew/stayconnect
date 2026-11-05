import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ColorSheet } from "@/components/profile/color-sheet";

afterEach(cleanup);

const swatches = [
  { id: "red", label: "Red", color: "#B73420" },
  { id: "teal", label: "Teal", color: "#106F6C" },
];
const props = { groupName: "Madrid Crew", swatches, selected: "red", overridden: false, onPick: () => {}, onReset: () => {}, onCancel: () => {} };

describe("color sheet (COLOR-10)", () => {
  it("shows a swatch per color with the current one pressed, and says only you see it", () => {
    render(<ColorSheet {...props} />);
    expect(screen.getByRole("dialog", { name: "Madrid Crew color" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Red" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Teal" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Only you see this.")).toBeTruthy();
  });

  it("keeps swatches at least 44px on any phone", () => {
    render(<ColorSheet {...props} />);
    const { minWidth, minHeight } = screen.getByRole("button", { name: "Teal" }).style;
    expect([minWidth, minHeight]).toEqual(["44px", "44px"]);
  });

  it("picks a color", () => {
    const onPick = vi.fn();
    render(<ColorSheet {...props} onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: "Teal" }));
    expect(onPick).toHaveBeenCalledWith("teal");
  });

  it("offers the reset only with an override", () => {
    const onReset = vi.fn();
    const { rerender } = render(<ColorSheet {...props} onReset={onReset} />);
    expect(screen.queryByRole("button", { name: "Use group color" })).toBeNull();
    rerender(<ColorSheet {...props} onReset={onReset} overridden />);
    fireEvent.click(screen.getByRole("button", { name: "Use group color" }));
    expect(onReset).toHaveBeenCalled();
  });
});
