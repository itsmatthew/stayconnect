import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Daily5Screen, type Daily5ScreenProps } from "@/components/daily5/daily5-screen";
import { recipientSections } from "@/app/intro/parties";
import { friends, placeholderGroups } from "@/app/intro/placeholder-data";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const cards = ["Oct 6, 2023", "May 24, 2024", "Jul 2, 2023", "Jul 2, 2023", "Mar 14, 2024"].map((dateLabel, i) => ({
  id: `p${i}`,
  src: `blob:p${i}`,
  alt: `Photo from ${dateLabel}`,
  dateLabel,
}));
const pools: Daily5ScreenProps["pools"] = [
  { id: "mine", label: "My photos", count: 12, skipped: 0 },
  { id: "family", label: "Family computer", count: 40, skipped: 3, progress: { done: 4, total: 10 } },
];

function renderScreen(over: Partial<Daily5ScreenProps> = {}) {
  const props: Daily5ScreenProps = {
    todayLabel: "Tuesday, Oct 6",
    cards,
    pools,
    recipients: recipientSections(placeholderGroups, friends),
    onAddFiles: vi.fn(),
    onSend: vi.fn(),
    nav: { current: "Daily 5", onNavigate: vi.fn() },
    ...over,
  };
  return { ...render(<Daily5Screen {...props} />), props };
}

describe("Daily 5 screen", () => {
  it("shows the banner with today's date (D5-9)", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: "Daily 5" })).toBeTruthy();
    expect(screen.getByText("Tuesday, Oct 6")).toBeTruthy();
  });

  it("shows each photo as a polaroid with its date and a send button (D5-9)", () => {
    renderScreen();
    const polaroids = screen.getAllByRole("article");
    expect(polaroids).toHaveLength(5);
    polaroids.forEach((p, i) => {
      expect(within(p).getByRole("img", { name: cards[i].alt }).getAttribute("src")).toBe(cards[i].src);
      expect(within(p).getByText(cards[i].dateLabel)).toBeTruthy();
      expect(within(p).getByRole("button", { name: "Send this photo to someone" })).toBeTruthy();
    });
  });

  it("cycles the reference's frame colours and tilts (D5-9)", () => {
    renderScreen();
    const polaroids = screen.getAllByRole("article");
    expect(polaroids.map((p) => p.dataset.frame)).toEqual(["#C8432B", "#F0B429", "#4F8A3C", "#3F9AD8", "#7A4E8C"]);
    expect(polaroids.map((p) => p.style.transform)).toEqual([
      "rotate(-1.2deg)",
      "rotate(1deg)",
      "rotate(-0.8deg)",
      "rotate(1.3deg)",
      "rotate(-1deg)",
    ]);
  });

  it("shows both pools with counts, import progress and skipped files (D5-2)", () => {
    renderScreen();
    const mine = screen.getByRole("group", { name: "My photos" });
    const family = screen.getByRole("group", { name: "Family computer" });
    expect(mine.textContent).toContain("12 photos");
    expect(family.textContent).toContain("40 photos");
    expect(family.textContent).toContain("Importing 4 of 10");
    expect(family.textContent).toContain("3 skipped");
    for (const g of [mine, family]) {
      expect(within(g).getByText("Choose folder")).toBeTruthy();
      expect(within(g).getByText("Choose photos")).toBeTruthy();
    }
  });

  it("offers a whole-folder picker and a many-photos picker per pool (D5-2)", () => {
    const { props } = renderScreen();
    const mine = screen.getByRole("group", { name: "My photos" });
    const folder = within(mine).getByLabelText("Choose folder") as HTMLInputElement;
    const photos = within(mine).getByLabelText("Choose photos") as HTMLInputElement;
    expect(folder.type).toBe("file");
    expect(folder.hasAttribute("webkitdirectory")).toBe(true);
    expect(photos.multiple).toBe(true);
    expect(photos.accept).toBe("image/*");
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    fireEvent.change(photos, { target: { files: [file] } });
    expect(props.onAddFiles).toHaveBeenCalledWith("mine", [file]);
  });

  it("explains the empty state and keeps the pools reachable (D5-10)", () => {
    renderScreen({ cards: [] });
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText(/at least a year old/)).toBeTruthy();
    expect(screen.getByRole("group", { name: "My photos" })).toBeTruthy();
  });

  it("opens the send sheet for that photo (D5-11)", () => {
    renderScreen();
    fireEvent.click(within(screen.getAllByRole("article")[2]).getByRole("button", { name: "Send this photo to someone" }));
    const sheet = screen.getByRole("dialog", { name: "Send this to…" });
    expect(within(sheet).getByRole("img", { name: cards[2].alt })).toBeTruthy();
    fireEvent.click(within(sheet).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sends, flies the photo off, then shows a brief “Sent ✓” that fades (D5-12)", () => {
    const { props, container } = renderScreen();
    fireEvent.click(within(screen.getAllByRole("article")[1]).getByRole("button", { name: "Send this photo to someone" }));
    const sheet = screen.getByRole("dialog", { name: "Send this to…" });
    fireEvent.click(within(sheet).getByRole("button", { name: "Send to Madrid Crew" }));
    fireEvent.click(within(sheet).getByRole("button", { name: "Send" }));

    expect(props.onSend).toHaveBeenCalledWith({ cardId: "p1", recipientId: "group:madrid-crew", note: "" });
    expect(screen.queryByRole("dialog")).toBeNull();
    const flight = container.querySelector("[data-sent-flight]") as HTMLElement;
    expect(flight).not.toBeNull();
    expect(flight.querySelector<HTMLElement>("[data-fly]")!.style.animation).toContain("sd-fly");
    expect(flight.querySelector<HTMLElement>("[data-fly]")!.className).toContain("sd-anim");
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Sent ✓");
    expect(status.style.animation).toContain("sd-pop");

    act(() => vi.advanceTimersByTime(2300));
    expect(container.querySelector("[data-sent-flight]")).not.toBeNull();
    act(() => vi.advanceTimersByTime(100));
    expect(container.querySelector("[data-sent-flight]")).toBeNull();
    expect(screen.queryByText("Sent ✓")).toBeNull();
  });

  it("marks the nav's current tab and reports nav taps (D5-1)", () => {
    const { props } = renderScreen();
    const nav = screen.getAllByRole("navigation", { name: "Main" })[0];
    expect(within(nav).getByRole("button", { name: "Daily 5" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(within(nav).getByRole("button", { name: "Messages" }));
    expect(props.nav.onNavigate).toHaveBeenCalledWith("Messages");
  });
});
