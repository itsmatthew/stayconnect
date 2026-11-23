import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, type AppData } from "@/app/intro/app-data";
import { AppShown } from "@/app/intro/app-shown";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { Share } from "@/app/intro/mail/mail";
import { chatStorageKey } from "@/app/intro/messages/use-chat";
import type { ChatState } from "@/app/intro/messages/conversations";
import { reachOutTimes } from "@/app/intro/nudges/schedule";
import { emptyNudges, type NudgeState, type NudgeStore } from "@/app/intro/nudges/state";

// Nudges & check-ins in the app (docs/specs/nudges.md).

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const WEDNESDAY = at(2026, 11, 25, 12);
const SUNDAY_EVENING = at(2026, 11, 29, 18, 30);
let n = 0;
/** The demo, without its waiting gifts: they pop up first, and a nudge waits for them (NUDGE-8). */
const data: AppData = { ...demoData, gifts: () => [] };

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

/** Kept in memory, like localStorage across a reload. */
function memoryStore(start: NudgeState = emptyNudges): NudgeStore & { saved: NudgeState } {
  const s = {
    saved: start,
    load: async () => s.saved,
    save: async (next: NudgeState) => void (s.saved = next),
  };
  return s;
}

type Opts = { now?: number; tab?: "Circles" | "Me"; shown?: boolean; store?: NudgeStore; share?: Share; id?: number };
const renderApp = ({ now = WEDNESDAY, tab = "Circles", shown = true, store = memoryStore(), share = { share: async () => "shared" }, id = ++n }: Opts = {}) =>
  render(
    <AppShown.Provider value={shown}>
      <AppClient
        initialTab={tab}
        data={data}
        now={() => now}
        openStore={() => openPhotoStore(`nudge-photos-${id}`)}
        openArchive={() => openArchiveStore(`nudge-archive-${id}`)}
        hasFace={async () => true}
        decode={async (f) => f}
        nudgeStore={() => store}
        share={() => share}
      />
    </AppShown.Provider>,
  );

const settingsScreen = () => screen.getByRole("dialog", { name: "Nudges & check-ins" });
const openSettings = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /^Nudges & check-ins/ }));
  return settingsScreen();
};

describe("settings (NUDGE-1 to NUDGE-7)", () => {
  it("opens from Me; pick people, switches and how often; kept after the app reopens", async () => {
    const store = memoryStore();
    const first = renderApp({ tab: "Me", store });
    const s = await openSettings();
    expect(within(s).getByText("Nobody picked yet. Two to four works best.")).toBeTruthy();
    fireEvent.click(within(s).getByRole("button", { name: "Leo" }));
    fireEvent.click(within(s).getByRole("button", { name: "Priya" }));
    expect(within(s).getByRole("button", { name: "Leo" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(s).getByText("2 people picked. Two to four works best.")).toBeTruthy();
    fireEvent.click(within(s).getByRole("radio", { name: "2 a week" }));
    expect(within(s).getByText("Two a week, at random times. A nudge never means anything about anyone.")).toBeTruthy();
    fireEvent.click(within(s).getByRole("switch", { name: "Quiet hours" }));
    expect(within(s).getByRole("switch", { name: "Quiet hours" }).getAttribute("aria-checked")).toBe("false");
    expect(within(s).getByRole("link", { name: "988" }).getAttribute("href")).toBe("tel:988");
    fireEvent.click(within(s).getByRole("button", { name: "Add someone not on the app" }));
    expect(within(s).getByText("Adding someone by their number comes later.")).toBeTruthy();
    fireEvent.click(within(s).getByRole("button", { name: "Back to Me" }));
    expect(screen.queryByRole("dialog", { name: "Nudges & check-ins" })).toBeNull();
    await waitFor(() => expect(store.saved.settings).toEqual({ people: ["leo", "priya"], sunday: true, perWeek: 2, quiet: false }));

    first.unmount();
    renderApp({ tab: "Me", store });
    const again = await openSettings();
    await waitFor(() => expect(within(again).getByRole("button", { name: "Leo" }).getAttribute("aria-pressed")).toBe("true"));
  });
});

describe("the Sunday check-in (NUDGE-13 to NUDGE-16)", () => {
  it("comes on Sunday evening on Circles; Close skips the week and it doesn't come back", async () => {
    const store = memoryStore();
    const first = renderApp({ now: SUNDAY_EVENING, store });
    const card = await screen.findByRole("dialog", { name: "Sunday check-in" });
    expect(within(card).getByText("How have you really been this week?")).toBeTruthy();
    expect(within(card).getByText("Only you see your answer. Always.")).toBeTruthy();
    fireEvent.click(within(card).getByRole("button", { name: "Not this week" }));
    expect(screen.queryByRole("dialog", { name: "Sunday check-in" })).toBeNull();
    await waitFor(() => expect(store.saved.log.checkIns).toEqual({ "2026-W48": "skipped" }));
    first.unmount();
    renderApp({ now: SUNDAY_EVENING + 60_000, store });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Sunday check-in" })).toBeNull();
  });

  it("waits while the intro is still on, and never comes on a weekday", async () => {
    renderApp({ now: SUNDAY_EVENING, shown: false });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Sunday check-in" })).toBeNull();
    cleanup();
    renderApp({ now: at(2026, 11, 28, 19) });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Sunday check-in" })).toBeNull();
  });

  it("a good week: thanks, and the answer is kept only here", async () => {
    const store = memoryStore();
    renderApp({ now: SUNDAY_EVENING, store });
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Sunday check-in" })).getByRole("button", { name: "Good week" }));
    expect(screen.getByText("Thanks for checking in.")).toBeTruthy();
    await waitFor(() => expect(store.saved.log.checkIns["2026-W48"]).toBe("good"));
  });

  it("a rough week, told: your share sheet opens with the text and no link; it never says your people know", async () => {
    const sent: { url?: string; text: string }[] = [];
    const share: Share = { share: async (req) => (sent.push(req), "shared") };
    renderApp({ now: SUNDAY_EVENING, share, store: memoryStore({ ...emptyNudges, settings: { ...emptyNudges.settings, people: ["leo", "ana"] } }) });
    const card = await screen.findByRole("dialog", { name: "Sunday check-in" });
    fireEvent.click(within(card).getByRole("button", { name: "Rough week" }));
    expect(screen.getByText("Thanks for being honest.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "988" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Let my people know/ }));
    expect(screen.getByText("Send it to Leo and Ana")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Send it" }));
    await screen.findByText("Hope you have a better week. Remember, you are loved.");
    expect(sent).toEqual([{ text: "Having a rough week. Would mean a lot if you checked in on me." }]);
    expect(screen.queryByText(/Your people know/)).toBeNull();
  });

  it("a rough week with nobody picked asks you to pick first; Not right now says nobody will know", async () => {
    renderApp({ now: SUNDAY_EVENING });
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Sunday check-in" })).getByRole("button", { name: "Rough week" }));
    fireEvent.click(screen.getByRole("button", { name: /^Not right now/ }));
    expect(screen.getByText(/Nobody will know you answered/)).toBeTruthy();
    cleanup();

    renderApp({ now: SUNDAY_EVENING });
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Sunday check-in" })).getByRole("button", { name: "Rough week" }));
    fireEvent.click(screen.getByRole("button", { name: /Let my people know/ }));
    fireEvent.click(screen.getByRole("button", { name: "Pick your check-in people first" }));
    expect(settingsScreen()).toBeTruthy();
  });

  it("Check in now opens it any day from the settings", async () => {
    renderApp({ tab: "Me" });
    fireEvent.click(within(await openSettings()).getByRole("button", { name: "Check in now" }));
    expect(await screen.findByRole("dialog", { name: "Sunday check-in" })).toBeTruthy();
  });
});

describe("reach out (NUDGE-8 to NUDGE-12)", () => {
  // A weekday time after this week's one nudge, with the Sunday check-in off so it can't come first.
  const due = Math.max(...reachOutTimes(WEDNESDAY, 1, true)) + 60_000;
  const reachStore = () => memoryStore({ ...emptyNudges, settings: { ...emptyNudges.settings, sunday: false } });
  const sealed = () => (JSON.parse(localStorage.getItem(chatStorageKey(demoData.storageSuffix)) ?? "{}") as ChatState).sealed ?? [];

  it("comes once its time has passed, three people with their actions; it shows once", async () => {
    const store = reachStore();
    const first = renderApp({ now: due, store });
    const sheet = await screen.findByRole("dialog", { name: "Reach out today" });
    const rows = within(sheet).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByRole("button", { name: /^Share a memory with / })).toBeTruthy();
    expect(within(rows[1]).getByRole("button", { name: /^Send a throwback with / })).toBeTruthy();
    expect(within(rows[2]).getByRole("button", { name: /^Make plans with / })).toBeTruthy();
    await waitFor(() => expect(store.saved.log.reachOut.length).toBeGreaterThan(0));
    fireEvent.click(within(sheet).getByRole("button", { name: "Close" }));
    first.unmount();
    renderApp({ now: due + 60_000, store });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Reach out today" })).toBeNull();
  });

  it("not before its time, not with it off, and not on another tab", async () => {
    renderApp({ now: Math.min(...reachOutTimes(WEDNESDAY, 1, true)) - 60_000, store: reachStore() });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Reach out today" })).toBeNull();
    cleanup();
    renderApp({ now: due, store: memoryStore({ ...emptyNudges, settings: { ...emptyNudges.settings, sunday: false, perWeek: 0 } }) });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Reach out today" })).toBeNull();
    cleanup();
    renderApp({ now: due, tab: "Me", store: reachStore() });
    await act(async () => {});
    expect(screen.queryByRole("dialog", { name: "Reach out today" })).toBeNull();
  });

  it("share a memory from your photos: it's sent sealed, then Sent, then the row says Sent", async () => {
    renderApp({ now: due, store: reachStore() });
    const sheet = await screen.findByRole("dialog", { name: "Reach out today" });
    const action = within(within(sheet).getAllByRole("listitem")[0]).getByRole("button", { name: /^Share a memory with / });
    const name = action.getAttribute("aria-label")!.replace("Share a memory with ", "");
    fireEvent.click(action);
    const send = screen.getByRole("button", { name: `Send to ${name}` }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Choose from your photos"), { target: { files: [new File(["x"], "us.jpg", { type: "image/jpeg", lastModified: at(2019, 6, 1) })] } });
    await waitFor(() => expect((screen.getByRole("button", { name: `Send to ${name}` }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "still think about this" }));
    expect((screen.getByLabelText("Your note") as HTMLTextAreaElement).value).toBe("still think about this");
    fireEvent.click(screen.getByRole("button", { name: `Send to ${name}` }));
    const sent = await screen.findByRole("dialog", { name: `Sent to ${name}` });
    expect(within(sent).getByText("Their ornament glows on your tree until they write back.")).toBeTruthy();
    expect(within(sent).getByText("1 of 3 today")).toBeTruthy();
    await waitFor(() => expect(sealed()).toHaveLength(1));
    expect(sealed()[0].note).toBe("still think about this");
    fireEvent.click(within(sent).getByRole("button", { name: "Done" }));
    const back = screen.getByRole("dialog", { name: "Reach out today" });
    expect(within(within(back).getAllByRole("listitem")[0]).getByText("Sent")).toBeTruthy();
  });

  it("make plans sends your words as a text", async () => {
    renderApp({ now: due, store: reachStore() });
    const sheet = await screen.findByRole("dialog", { name: "Reach out today" });
    const action = within(within(sheet).getAllByRole("listitem")[2]).getByRole("button", { name: /^Make plans with / });
    const name = action.getAttribute("aria-label")!.replace("Make plans with ", "");
    fireEvent.click(action);
    fireEvent.click(screen.getByRole("button", { name: "free this weekend?" }));
    fireEvent.click(screen.getByRole("button", { name: `Send to ${name}` }));
    await screen.findByRole("dialog", { name: `Sent to ${name}` });
    const chat = JSON.parse(localStorage.getItem(chatStorageKey(demoData.storageSuffix))!) as ChatState;
    const texts = Object.values(chat.conversations).flatMap((c) => c.messages).filter((m) => m.kind === "text" && m.text === "free this weekend?");
    expect(texts).toHaveLength(1);
  });
});
