import "fake-indexeddb/auto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { demoDataEnabled } from "@/app/intro/demo";
import { friends, placeholderGroups, placeholderPosts, placeholderReplies, seedConversations } from "@/app/intro/placeholder-data";

const NOW = new Date(2026, 9, 20, 12).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe("the switch (DEMO-1)", () => {
  it("an explicit on/off wins; unset, it's on only in development", () => {
    expect(demoDataEnabled({ flag: "on", nodeEnv: "production" })).toBe(true);
    expect(demoDataEnabled({ flag: "off", nodeEnv: "development" })).toBe(false);
    expect(demoDataEnabled({ flag: undefined, nodeEnv: "development" })).toBe(true);
    expect(demoDataEnabled({ flag: undefined, nodeEnv: "production" })).toBe(false);
    expect(demoDataEnabled({ flag: undefined, nodeEnv: "test" })).toBe(false);
  });

  it("only app-data.ts imports the placeholder data", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
    const importers = files("src")
      .filter((f) => /\.tsx?$/.test(f) && /from ["'][^"']*placeholder-data["']/.test(readFileSync(f, "utf8")))
      .map((f) => f.replaceAll("\\", "/"));
    expect(importers).toEqual(["src/app/intro/app-data.ts"]);
  });

  it("the empty data holds nothing", () => {
    expect(emptyData.groups).toEqual([]);
    expect(emptyData.friends).toEqual([]);
    expect(emptyData.seedConversations(NOW)).toEqual([]);
    expect(emptyData.replies).toEqual([]);
    expect(emptyData.posts(NOW)).toEqual([]);
    expect(emptyData.viewerOf).toEqual([]);
  });
});

function renderOff(initialTab: "Circles" | "Daily 5" | "Archive" | "Messages" | "Me") {
  const id = ++n;
  return render(
    <AppClient
      initialTab={initialTab}
      data={emptyData}
      now={() => NOW}
      openStore={() => openPhotoStore(`demo-off-photos-${id}`)}
      openArchive={() => openArchiveStore(`demo-off-archive-${id}`)}
      hasFace={async () => true}
    />,
  );
}
const tap = (label: string) => fireEvent.click(within(screen.getAllByRole("navigation", { name: "Main" })[0]).getByRole("button", { name: label }));

describe("empty states with the switch off (DEMO-2)", () => {
  it("Home: a sapling and a way to Daily 5", () => {
    renderOff("Circles");
    expect(screen.getByRole("img", { name: "A young sapling" })).toBeTruthy();
    expect(screen.getByText("Your circles grow when someone sends you a memory — or send one first")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to Daily 5" }));
    expect(screen.getByRole("heading", { name: "Daily 5" })).toBeTruthy();
  });

  it("Messages: no messages yet", () => {
    renderOff("Messages");
    expect(screen.getByText("No messages yet. Send a memory to start one.")).toBeTruthy();
  });

  it("Archive: your slots and the locked state, nobody posted", async () => {
    renderOff("Archive");
    expect(await screen.findByRole("region", { name: "Photo of the week" })).toBeTruthy();
    expect((await screen.findByRole("region", { name: "Week 43" })).textContent).toContain("No one's posted this week yet — be the first");
  });

  it("Me: the year's empty slots", async () => {
    renderOff("Me");
    const items = within(await screen.findByRole("list", { name: "Your 65 for 2026" })).getAllByRole("listitem");
    expect(items).toHaveLength(66);
    for (const i of items) expect(i.getAttribute("aria-label")).toMatch(/waiting to be filled$/);
  });
});

describe("no placeholder data anywhere (DEMO-4)", () => {
  const words = [
    ...friends.map((f) => f.name),
    ...placeholderGroups.map((g) => g.name),
    ...placeholderGroups.flatMap((g) => g.memories.map((m) => m.caption.replace("\n", " "))),
    ...placeholderReplies,
    ...seedConversations(NOW).flatMap((c) => c.messages.flatMap((m) => (m.kind === "text" ? [m.text] : []))),
    ...placeholderPosts(NOW).flatMap((p) => (p.caption ? [p.caption] : [])),
  ];
  const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const placeholder = new RegExp(`\\b(${words.map(escape).join("|")})\\b`);

  const visibleText = () => {
    const attrs = Array.from(document.querySelectorAll("[aria-label],[alt],[title],[placeholder]")).flatMap((el) =>
      ["aria-label", "alt", "title", "placeholder"].map((a) => el.getAttribute(a) ?? ""),
    );
    // "Family computer" is Daily 5's pool label, not the placeholder Family circle.
    return [document.body.textContent ?? "", ...attrs].join("\n").replaceAll("Family computer", "");
  };

  it("on every tab, and in what's saved", async () => {
    renderOff("Circles");
    for (const tab of ["Circles", "Daily 5", "Archive", "Messages", "Me"]) {
      tap(tab);
      if (tab === "Archive") await screen.findByRole("region", { name: "Photo of the week" });
      if (tab === "Me") await screen.findByRole("list", { name: "Your 65 for 2026" });
      expect(visibleText()).not.toMatch(placeholder);
    }
    await waitFor(() => {
      const saved = Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? "").join("\n");
      expect(saved).not.toMatch(placeholder);
    });
  });
});
