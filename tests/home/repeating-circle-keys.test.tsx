import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor, within } from "@testing-library/react";
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

describe("one circle, repeated round the carousel (HOME, web keeps the repeating trees)", () => {
  it("draws each repeat as its own tree, with no duplicate React keys", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(myCirclesKey(""), JSON.stringify([{ id: "mine-1", name: "Red Robin", colorId: "red", createdAt: 1 }]));
    render(
      <AppClient
        data={emptyData}
        now={() => 2}
        openStore={() => openPhotoStore("sc-photos-keys")}
        openArchive={() => openArchiveStore("sc-archive-keys")}
        openOrnaments={() => openOrnamentStore("sc-orn-keys")}
        hasFace={async () => true}
      />,
    );
    const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement;
    await waitFor(() => expect(within(phone()).getAllByText("Red Robin").length).toBeGreaterThan(1));
    const dupes = errors.mock.calls.filter((c) => String(c[0]).includes("same key"));
    expect(dupes.map((c) => c[1])).toEqual([]);
  });
});
