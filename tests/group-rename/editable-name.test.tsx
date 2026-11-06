import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EditableName } from "@/components/shared/editable-name";

afterEach(cleanup);

const button = () => screen.getByRole("button", { name: "Rename Madrid Crew" });

describe("editable name (RENAME-2)", () => {
  it("is one button: the name, then a small pencil right after it", () => {
    render(<EditableName name="Madrid Crew" onEdit={() => {}} />);
    const pencil = button().querySelector("[data-pencil]")!;
    expect(button().textContent).toBe("Madrid Crew");
    expect(pencil.tagName.toLowerCase()).toBe("svg");
    expect(pencil.getAttribute("aria-hidden")).toBe("true");
  });

  it("follows the last word when a name wraps", () => {
    render(<EditableName name="Madrid Crew" onEdit={() => {}} />);
    const name = within(button()).getByText("Madrid Crew");
    const pencil = button().querySelector<SVGElement>("[data-pencil]")!;
    expect(name.lastElementChild).toBe(pencil);
    // Tailwind's reset makes every svg a block, which would drop it onto its own line.
    expect(pencil.style.display).toBe("inline");
  });

  it("opens from the name and from the pencil", () => {
    const onEdit = vi.fn();
    render(<EditableName name="Madrid Crew" onEdit={onEdit} />);
    fireEvent.click(within(button()).getByText("Madrid Crew"));
    fireEvent.click(button().querySelector("[data-pencil]")!);
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it("has a tap area at least 44px tall", () => {
    render(<EditableName name="Madrid Crew" onEdit={() => {}} />);
    expect(button().style.minHeight).toBe("44px");
  });

  it("keeps the tap to itself, so anything around it doesn't fire", () => {
    const around = vi.fn();
    const onEdit = vi.fn();
    render(
      <div onClick={around}>
        <EditableName name="Madrid Crew" onEdit={onEdit} />
      </div>,
    );
    fireEvent.click(within(button()).getByText("Madrid Crew"));
    expect(onEdit).toHaveBeenCalled();
    expect(around).not.toHaveBeenCalled();
  });

  it("can cut a long name to two lines, keeping the pencil in view", () => {
    render(<EditableName name="Madrid Crew" onEdit={() => {}} clamp />);
    const name = within(button()).getByText("Madrid Crew");
    expect(name.className).toBe("hm-card-name");
    expect(name.style.minWidth).toBe("0px");
    // Outside the clamped text, or the ellipsis would cut it off.
    expect(name.querySelector("[data-pencil]")).toBeNull();
    expect(button().querySelector(":scope > [data-pencil]")).toBeTruthy();
  });
});
