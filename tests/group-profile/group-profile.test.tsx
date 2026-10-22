import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { formatPhotoDate } from "@/app/intro/daily5/format";
import { ME, chatReducer, initialChatState, type ChatMessage, type Conversation } from "@/app/intro/messages/conversations";
import { chatStorageKey } from "@/app/intro/messages/use-chat";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { goalsStorageKey } from "@/app/intro/profile/use-goals";

// Wednesday Oct 21 2026 (ISO 2026-W43).
const NOW = new Date(2026, 9, 21, 12).getTime();
const HOUR = 3_600_000;
const MADRID = "group:madrid-crew";
let n = 0;
let dbName = "";

/** The latest IntersectionObserver, so a test can scroll the end of a grid into view. */
let observers: { fire(): void }[] = [];
class FakeObserver {
  private targets: Element[] = [];
  constructor(private cb: IntersectionObserverCallback) {
    observers.push(this);
  }
  observe(el: Element) {
    this.targets.push(el);
  }
  unobserve() {}
  disconnect() {
    this.targets = [];
  }
  takeRecords() {
    return [];
  }
  fire() {
    this.cb(
      this.targets.map((target) => ({ isIntersecting: true, target }) as IntersectionObserverEntry),
      this as unknown as IntersectionObserver,
    );
  }
}

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `group-profile-${++n}`;
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** `count` memories in Madrid Crew's chat, memory i sent after memory i-1, each taken on its own day in 2010 (Jan 1 + i). */
function madridMemories(count: number, extra: (i: number) => Partial<Extract<ChatMessage, { kind: "memory" }>> = () => ({})): ChatMessage[] {
  return Array.from({ length: count }, (_, i): ChatMessage => ({
    id: `mem-${i}`,
    kind: "memory",
    from: "leo",
    at: NOW - (count - i) * HOUR,
    photoId: `seed-${i}`,
    art: "sunset",
    takenAt: new Date(2010, 0, 1 + i).getTime(),
    note: "",
    ...extra(i),
  }));
}
const photoLabel = (i: number) => `Photo from ${formatPhotoDate(new Date(2010, 0, 1 + i).getTime())}`;

/** Demo data with Madrid Crew's memories replaced by `memories` (its text messages stay). */
function withMadrid(memories: ChatMessage[], over: Partial<AppData> = {}): AppData {
  return {
    ...demoData,
    seedConversations: (now: number): Conversation[] =>
      demoData
        .seedConversations(now)
        .map((c) => (c.id === MADRID ? { ...c, messages: [...c.messages.filter((m) => m.kind === "text"), ...memories].sort((a, b) => a.at - b.at) } : c)),
    ...over,
  };
}
/** Seals a memory in Madrid Crew's chat, saved as if sent earlier. */
function sealInMadrid(data: AppData, takenAt: Date) {
  const s = chatReducer(initialChatState(data.seedConversations(NOW)), {
    type: "sendMemory",
    id: "sealed",
    conversationId: MADRID,
    photoId: "p",
    takenAt: takenAt.getTime(),
    note: "",
    at: NOW - 60_000,
  });
  localStorage.setItem(chatStorageKey(data.storageSuffix), JSON.stringify(s));
}

function renderApp(data: AppData = demoData) {
  return render(
    <AppClient
      initialTab="Messages"
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(`${dbName}-ornaments`)}
      decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
      crop={async () => new Blob(["crop"], { type: "image/jpeg" })}
      hasFace={async () => true}
    />,
  );
}

const tap = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const openThread = (name: string) => fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`^${name}, `) })[0]);
const profileButtons = () => screen.queryAllByRole("button", { name: "Open Madrid Crew profile" });
function openProfile(data?: AppData) {
  const utils = renderApp(data);
  openThread("Madrid Crew");
  fireEvent.click(profileButtons()[1]);
  return utils;
}
const profile = () => screen.getByRole("main", { name: "Madrid Crew profile" });
const nextCard = () => within(profile()).getByRole("region", { name: "Next time together" });
const recent = () => within(profile()).getByRole("region", { name: "Recent photos" });
const photos = (el: HTMLElement) => within(el).queryAllByRole("img", { name: /^Photo from / }).map((p) => p.getAttribute("aria-label"));

describe("open and close (GP-1)", () => {
  it("in a group thread, the logo, the name and each filled header photo open the profile; Back returns to the chat", () => {
    renderApp();
    openThread("Madrid Crew");
    // Both demo halves are set (GP-12): photo, photo, logo, name.
    expect(profileButtons()).toHaveLength(4);

    for (let i = 0; i < 4; i++) {
      fireEvent.click(profileButtons()[i]);
      expect(within(profile()).getByRole("heading", { level: 1, name: "Madrid Crew" })).toBeTruthy();
      tap("Back to the chat");
      expect(screen.getByRole("textbox", { name: "Message Madrid Crew" })).toBeTruthy();
    }
  });

  it("the thread no longer changes the logo; friend threads have no profile", () => {
    renderApp();
    openThread("Madrid Crew");
    expect(screen.queryByRole("button", { name: "Change Madrid Crew logo" })).toBeNull();
    tap("Back to messages");
    openThread("Leo");
    expect(screen.queryAllByRole("button", { name: /profile$/ })).toHaveLength(0);
  });
});

describe("header (GP-2)", () => {
  it("shows the logo and name, and changes the logo from here", () => {
    openProfile();
    expect(within(profile()).getAllByRole("img", { name: "Madrid Crew logo" }).length).toBeGreaterThan(0);
    fireEvent.click(within(profile()).getByRole("button", { name: "Change Madrid Crew logo" }));
    expect(screen.getByRole("dialog", { name: "Madrid Crew logo" })).toBeTruthy();
  });
});

describe("members (GP-3)", () => {
  const members = () => within(profile()).getByRole("list", { name: "Members" });

  it("everyone, you first, by name only: no ranking anywhere, and no superlatives", () => {
    openProfile();
    expect(within(members()).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["You", "Leo", "Ana", "Nico"]);
    expect(document.body.textContent).not.toMatch(/most active|superlative|funniest|gone quiet|biggest gifter|streak/i);
    const labels = Array.from(document.querySelectorAll("[aria-label]"), (el) => el.getAttribute("aria-label")).join("\n");
    expect(labels).not.toMatch(/most active/i);
  });

  it("someone in your circle opens your 1:1 chat with them", () => {
    openProfile();
    fireEvent.click(within(members()).getByRole("button", { name: "Leo" }));
    expect(screen.getByRole("textbox", { name: "Message Leo" })).toBeTruthy();
  });

  it("someone not in your circle isn't a button yet", () => {
    const rings = Object.fromEntries(Object.entries(demoData.rings).filter(([id]) => id !== "nico"));
    openProfile({ ...demoData, rings });
    expect(within(members()).getByText("Nico")).toBeTruthy();
    expect(within(members()).queryByRole("button", { name: "Nico" })).toBeNull();
  });
});

describe("ornaments (GP-4)", () => {
  it("three buttons; one opens full size with its caption, and Edit opens the ornament sheet", async () => {
    openProfile();
    const buttons = within(profile()).getAllByRole("button", { name: /^View ornament \d of Madrid Crew$/ });
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([1, 2, 3].map((i) => `View ornament ${i} of Madrid Crew`));

    fireEvent.click(buttons[1]);
    const view = screen.getByRole("dialog", { name: "Ornament 2 of Madrid Crew" });
    expect(view.textContent).toContain("the 4am");
    fireEvent.click(within(view).getByRole("button", { name: "Edit" }));
    const sheet = await screen.findByRole("dialog", { name: "Madrid Crew’s defining memories" });
    expect(within(sheet).getByRole("button", { name: /2/, pressed: true })).toBeTruthy();
  });

  it("Close shuts the view", () => {
    openProfile();
    fireEvent.click(within(profile()).getByRole("button", { name: "View ornament 1 of Madrid Crew" }));
    tap("Close");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("recent photos (GP-5)", () => {
  it("the 9 newest visible memories, newest sent first", () => {
    openProfile(withMadrid(madridMemories(12)));
    expect(photos(recent())).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3].map(photoLabel));
  });

  it("See all: every visible memory, 24 at a time as the end scrolls into view", () => {
    openProfile(withMadrid(madridMemories(30)));
    fireEvent.click(within(recent()).getByRole("button", { name: "See all" }));
    const all = () => screen.getByRole("region", { name: "All photos" });
    expect(photos(all())).toHaveLength(24);
    expect(photos(all())[0]).toBe(photoLabel(29));
    observers.at(-1)!.fire();
    return waitFor(() => {
      expect(photos(all())).toHaveLength(30);
      expect(photos(all()).at(-1)).toBe(photoLabel(0));
    }).then(() => {
      tap("Back to the profile");
      expect(profile()).toBeTruthy();
    });
  });

  it("9 or fewer: no See all", () => {
    openProfile(withMadrid(madridMemories(9)));
    expect(photos(recent())).toHaveLength(9);
    expect(within(recent()).queryByRole("button", { name: "See all" })).toBeNull();
  });

  it("none: a nudge to Daily 5", () => {
    openProfile(withMadrid([]));
    expect(recent().textContent).toContain("No photos yet — send one from Daily 5");
  });

  it("sealed memories never show", () => {
    const data = withMadrid(madridMemories(2));
    sealInMadrid(data, new Date(2001, 0, 1));
    openProfile(data);
    expect(photos(recent())).toEqual([1, 0].map(photoLabel));
  });
});

describe("then (GP-6)", () => {
  const thenTile = () => within(nextCard()).queryByRole("img", { name: /^then/ });

  it("a memory from this week in an earlier year fills the left half", () => {
    openProfile(withMadrid(madridMemories(1, () => ({ takenAt: new Date(2023, 9, 25).getTime() }))));
    expect(thenTile()?.getAttribute("aria-label")).toBe("then: this week, 3 years ago");
    expect(nextCard().textContent).toContain("this week, 3 years ago");
  });

  it("no match: the goal fills the card", () => {
    openProfile(withMadrid(madridMemories(3)));
    expect(thenTile()).toBeNull();
    expect(nextCard().textContent).not.toContain("years ago");
  });

  it("a sealed memory from this week is never used", () => {
    const data = withMadrid([]);
    sealInMadrid(data, new Date(2023, 9, 25));
    openProfile(data);
    expect(thenTile()).toBeNull();
  });

  it("the demo shows one", () => {
    openProfile();
    expect(thenTile()).toBeTruthy();
  });
});

describe("next time together (GP-7/8/9)", () => {
  const noGoal: Partial<AppData> = { goals: () => ({}) };
  const dialog = () => screen.getByRole("dialog", { name: "Next time together" });
  const save = () => within(dialog()).getByRole("button", { name: "Save" }) as HTMLButtonElement;

  it("the demo: lake weekend in 46 days, all 4 in", () => {
    openProfile();
    const card = nextCard();
    expect(card.textContent).toContain("46");
    expect(card.textContent).toContain("days");
    expect(card.textContent).toContain("until lake weekend, Dec 6");
    expect(card.textContent).toContain("4 of 4 are in");
    expect(within(card).getByRole("button", { name: "You're in · undo" })).toBeTruthy();
  });

  it("no goal: “Set a goal”; the label is required, the date optional", () => {
    openProfile({ ...demoData, ...noGoal });
    expect(nextCard().textContent).toContain("Next time together");
    fireEvent.click(within(nextCard()).getByRole("button", { name: "Set a goal" }));
    expect(save().disabled).toBe(true);
    expect(within(dialog()).queryByRole("button", { name: "Clear goal" })).toBeNull();
    const label = within(dialog()).getByRole("textbox", { name: "What's the plan?" }) as HTMLInputElement;
    expect(label.placeholder).toBe("lake weekend");
    expect(label.maxLength).toBe(32);
    fireEvent.change(label, { target: { value: "   " } });
    expect(save().disabled).toBe(true);
    fireEvent.change(label, { target: { value: "dinner soon" } });
    expect(save().disabled).toBe(false);
    fireEvent.click(save());
    expect(nextCard().textContent).toContain("dinner soon");
    expect(nextCard().textContent).not.toContain("days");
    expect(nextCard().textContent).toContain("1 of 4 are in");
  });

  it("with a date: the countdown, “1 day”, “today”", () => {
    openProfile({ ...demoData, ...noGoal });
    const setGoal = (date: string) => {
      fireEvent.click(within(nextCard()).getByRole("button", { name: /^(Set a goal|Change goal)$/ }));
      fireEvent.change(within(dialog()).getByRole("textbox", { name: "What's the plan?" }), { target: { value: "lake weekend" } });
      fireEvent.change(within(dialog()).getByLabelText("When"), { target: { value: date } });
      fireEvent.click(save());
    };
    setGoal("2026-12-06");
    expect(nextCard().textContent).toContain("until lake weekend, Dec 6");
    setGoal("2026-10-22");
    expect(nextCard().textContent).toContain("1 day");
    setGoal("2026-10-21");
    expect(nextCard().textContent).toContain("today");
  });

  it("Cancel keeps the goal; Clear goal removes it", () => {
    openProfile();
    fireEvent.click(within(nextCard()).getByRole("button", { name: "Change goal" }));
    expect((within(dialog()).getByRole("textbox", { name: "What's the plan?" }) as HTMLInputElement).value).toBe("lake weekend");
    tap("Cancel");
    expect(nextCard().textContent).toContain("lake weekend");
    fireEvent.click(within(nextCard()).getByRole("button", { name: "Change goal" }));
    tap("Clear goal");
    expect(within(nextCard()).getByRole("button", { name: "Set a goal" })).toBeTruthy();
  });

  it("I'm in toggles, and the count follows (GP-8)", () => {
    openProfile();
    fireEvent.click(within(nextCard()).getByRole("button", { name: "You're in · undo" }));
    expect(nextCard().textContent).toContain("3 of 4 are in");
    fireEvent.click(within(nextCard()).getByRole("button", { name: "I'm in" }));
    expect(nextCard().textContent).toContain("4 of 4 are in");
  });

  it("changing only the label keeps the count; changing the date starts it fresh (GP-8)", () => {
    openProfile();
    const edit = (field: "What's the plan?" | "When", value: string) => {
      fireEvent.click(within(nextCard()).getByRole("button", { name: "Change goal" }));
      const input = field === "When" ? within(dialog()).getByLabelText("When") : within(dialog()).getByRole("textbox", { name: field });
      fireEvent.change(input, { target: { value } });
      fireEvent.click(save());
    };
    edit("What's the plan?", "lake weekend!!");
    expect(nextCard().textContent).toContain("4 of 4 are in");
    edit("When", "2026-12-13");
    expect(nextCard().textContent).toContain("1 of 4 are in");
  });

  it("past its date, the goal is gone (GP-9)", () => {
    openProfile({ ...demoData, goals: () => ({ "madrid-crew": { label: "lake weekend", date: "2026-10-20", setBy: "leo", in: ["leo"] } }) });
    expect(within(nextCard()).getByRole("button", { name: "Set a goal" })).toBeTruthy();
    expect(nextCard().textContent).not.toContain("lake weekend");
  });

  it("is kept across a reload, under the demo name (GP-11)", async () => {
    const first = openProfile({ ...demoData, ...noGoal });
    fireEvent.click(within(nextCard()).getByRole("button", { name: "Set a goal" }));
    fireEvent.change(within(dialog()).getByRole("textbox", { name: "What's the plan?" }), { target: { value: "ski trip" } });
    fireEvent.click(save());
    await waitFor(() => expect(localStorage.getItem(goalsStorageKey(".demo"))).toContain("ski trip"));
    first.unmount();
    openProfile({ ...demoData, ...noGoal });
    await waitFor(() => expect(nextCard().textContent).toContain("ski trip"));
  });

  it("you count among the members (n = members + you)", () => {
    openProfile({ ...demoData, goals: () => ({ "madrid-crew": { label: "lake weekend", setBy: "leo", in: ["leo", "ana"] } }) });
    expect(nextCard().textContent).toContain("2 of 4 are in");
    expect(within(nextCard()).getByRole("button", { name: "I'm in" })).toBeTruthy();
    expect(ME).toBe("me");
  });
});

describe("what everyone's up to (GP-10)", () => {
  it("the demo's rows show; with none the section is gone", () => {
    openProfile();
    expect(within(profile()).getByRole("heading", { name: "what everyone’s up to" })).toBeTruthy();
    cleanup();
    openProfile({ ...demoData, upTo: {} });
    expect(within(profile()).queryByRole("heading", { name: "what everyone’s up to" })).toBeNull();
  });
});
