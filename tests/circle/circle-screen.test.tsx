import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { CircleScreen } from "@/components/circle/circle-screen";
import { TREE_BOX } from "@/components/circle/ring-layout";
import type { CirclePerson } from "@/components/circle/types";

const look = { skin: "#EDB98F", hair: "#6B3F23", shirt: "#2B3350", bg: "#CFE0F4", ring: "#3F9AD8" };
const people: CirclePerson[] = [
  { id: "ana", name: "Ana", look, lit: true, ring: "nest" },
  { id: "leo", name: "Leo", look, lit: false, ring: "branches" },
  { id: "sam", name: "Sam", look, lit: false },
];

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup() {
  const onMove = vi.fn();
  const onOpenChat = vi.fn();
  render(
    <CircleScreen
      people={people}
      onMove={onMove}
      onOpenChat={onOpenChat}
      onAcceptSuggestion={() => {}}
      onDismissSuggestion={() => {}}
      view="circle"
      onViewChange={() => {}}
      nav={{ current: "Circles" }}
    />,
  );
  const phone = document.querySelector("[data-layout='phone']") as HTMLElement;
  const tree = within(phone).getByRole("group", { name: "Your circle tree" });
  // The tree box drawn at 1 design px per screen px, at the page's top left.
  tree.getBoundingClientRect = () => ({ left: 0, top: 0, width: TREE_BOX.width, height: TREE_BOX.height, right: TREE_BOX.width, bottom: TREE_BOX.height, x: 0, y: 0, toJSON: () => ({}) });
  const leo = within(tree).getByRole("button", { name: "Leo" });
  const status = within(phone).getByRole("status");
  return { onMove, onOpenChat, tree, leo, status };
}
/** A point in screen px, `dx`/`dy` from the canopy's center. */
const at = (dx: number, dy: number) => ({ clientX: TREE_BOX.cx + dx, clientY: TREE_BOX.cy + dy, pointerId: 1 });

function drag(leo: HTMLElement, to: { clientX: number; clientY: number; pointerId: number }) {
  fireEvent.pointerDown(leo, at(81, 0));
  act(() => vi.advanceTimersByTime(500));
  fireEvent.pointerMove(leo, to);
  fireEvent.pointerUp(leo, to);
  fireEvent.click(leo);
}

describe("drag to move (CIRCLE-7)", () => {
  it("press-and-hold picks someone up; the ring under the pointer lights; dropping moves them", () => {
    const { onMove, onOpenChat, tree, leo, status } = setup();
    fireEvent.pointerDown(leo, at(81, 0));
    act(() => vi.advanceTimersByTime(500));
    expect(tree.getAttribute("data-dragging")).toBe("leo");
    fireEvent.pointerMove(leo, at(0, 10));
    expect(tree.getAttribute("data-highlight")).toBe("nest");
    fireEvent.pointerMove(leo, at(0, 125));
    expect(tree.getAttribute("data-highlight")).toBe("bloom");
    fireEvent.pointerMove(leo, at(5, 5));
    fireEvent.pointerUp(leo, at(5, 5));
    fireEvent.click(leo);
    expect(onMove).toHaveBeenCalledWith("leo", "nest");
    expect(onOpenChat).not.toHaveBeenCalled();
    expect(tree.getAttribute("data-dragging")).toBeNull();
    expect(status.textContent).toBe("Leo moved to Nest");
    act(() => vi.advanceTimersByTime(4000));
    expect(status.textContent).toBe("");
  });

  it("dropping on their own ring, or outside the tree, changes nothing", () => {
    const { onMove, onOpenChat, leo, status } = setup();
    drag(leo, at(-81, 0));
    drag(leo, at(-TREE_BOX.cx, -TREE_BOX.cy));
    expect(onMove).not.toHaveBeenCalled();
    expect(onOpenChat).not.toHaveBeenCalled();
    expect(status.textContent).toBe("");
  });

  it("a quick tap is just a tap: it opens the chat (CIRCLE-6)", () => {
    const { onMove, onOpenChat, tree, leo } = setup();
    fireEvent.pointerDown(leo, at(81, 0));
    act(() => vi.advanceTimersByTime(150));
    fireEvent.pointerUp(leo, at(81, 0));
    fireEvent.click(leo);
    expect(tree.getAttribute("data-dragging")).toBeNull();
    expect(onOpenChat).toHaveBeenCalledWith("leo");
    expect(onMove).not.toHaveBeenCalled();
  });

  it("only placed people are in the tree", () => {
    const { tree } = setup();
    expect(within(tree).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Leo", "Ana"]);
  });
});
