import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { myCirclesKey } from "@/app/intro/onboarding/local-my-circles";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

let n = 0;
const renderWith = (names: string[]) => {
  localStorage.setItem(myCirclesKey(""), JSON.stringify(names.map((name, i) => ({ id: `mine-${i}`, name, colorId: "red", createdAt: i + 1 }))));
  const id = ++n;
  render(
    <AppClient
      data={emptyData}
      now={() => 100}
      openStore={() => openPhotoStore(`sc-photos-keys${id}`)}
      openArchive={() => openArchiveStore(`sc-archive-keys${id}`)}
      openOrnaments={() => openOrnamentStore(`sc-orn-keys${id}`)}
      hasFace={async () => true}
    />,
  );
};
const layout = (which: "phone" | "wide") => document.querySelector(`[data-layout='${which}']`) as HTMLElement;
const labels = (which: "phone" | "wide") => [...layout(which).querySelectorAll("[data-tree-label]")].map((l) => l.textContent);

describe("fewer circles than trees (HOME-2, HOME-24)", () => {
  it("shows each circle once, and outline trees for the rest", async () => {
    renderWith(["Red Robin"]);
    await waitFor(() => expect(labels("wide")).toEqual(["new circle", "new circle", "Red Robin", "new circle", "new circle"]));
    expect(labels("phone")).toEqual(["new circle", "Red Robin", "new circle"]);
    expect(layout("wide").querySelectorAll("[data-outline]")).toHaveLength(4);
    expect(within(layout("wide")).getAllByRole("button", { name: "Start a new circle" })).toHaveLength(4);
    expect(within(layout("phone")).getAllByRole("button", { name: "Start a new circle" })).toHaveLength(2);
    // Ornaments only on the real circle's tree.
    expect(within(layout("wide")).getAllByRole("button", { name: /ornament \d of Red Robin/ })).toHaveLength(3);
  });

  it("two circles fill the center and its right", async () => {
    renderWith(["Red Robin", "Lake Week"]);
    await waitFor(() => expect(labels("wide").filter((l) => l !== "new circle")).toHaveLength(2));
    expect(labels("wide")[0]).toBe("new circle");
    expect(labels("wide")[1]).toBe("new circle");
    expect(labels("wide")[4]).toBe("new circle");
  });

  it("draws no duplicate React keys", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWith(["Red Robin"]);
    await waitFor(() => expect(labels("wide")).toContain("Red Robin"));
    fireEvent.click(within(layout("wide")).getByRole("button", { name: "Next circle" }));
    expect(errors.mock.calls.filter((c) => String(c[0]).includes("same key")).map((c) => c[1])).toEqual([]);
  });

  it("an outline tree starts a new circle, and Close on step 1 closes it with no letter", async () => {
    renderWith(["Red Robin"]);
    await waitFor(() => expect(labels("wide")).toContain("Red Robin"));
    fireEvent.click(within(layout("wide")).getAllByRole("button", { name: "Start a new circle" })[0]);
    const flow = screen.getByRole("dialog", { name: "Start a circle" });
    fireEvent.click(within(flow).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("article")).toBeNull();
  });
});
