/**
 * The tour after your first circle (docs/specs/onboarding.md, ONB-14 to ONB-18), from WelcomeLetter.dc.html.
 * Pure: the stops and how you walk them. Where each stop points is a list of `data-tour` names, first one present wins.
 */

export type TourTab = "Circles" | "Daily 5" | "Archive" | "Messages" | "Me";

export type Stop = {
  id: string;
  /** The tab it's on. */
  tab: TourTab;
  /** `data-tour` names to spotlight, the first one on screen wins. */
  targets: readonly string[];
  title: string;
  body: string;
  /** The last stop of a tab: after Got it, the spotlight moves to this tab in the nav. */
  next?: TourTab;
};

/** The design's eleven, in order. */
export const STOPS: readonly Stop[] = [
  { id: "planted", tab: "Circles", targets: ["nav:Daily 5"], title: "Your tree’s planted", body: "Let’s take a quick look around so you know what everything does." },
  // The phone asks for the camera roll ("Allow photos"); on the web you add photos to Daily 5's pools.
  { id: "d5", tab: "Daily 5", targets: ["d5-pools"], title: "Daily 5", body: "Every morning it picks five of your photos from at least 3 months ago. Add yours here to see your first five." },
  { id: "d5-today", tab: "Daily 5", targets: ["d5-card", "d5-empty"], title: "From back whenever", body: "Swipe through today’s five. Some will be from last week, some from years ago." },
  { id: "d5-send", tab: "Daily 5", targets: ["d5-send", "d5-empty"], title: "Send one", body: "Drop it in a circle’s chat, leave it in someone’s mailbox, or wrap it as a gift.", next: "Archive" },
  { id: "ar-week", tab: "Archive", targets: ["ar-week"], title: "65 Archive", body: "Once a week, post your favorite photo of the week. It closes Sunday at 11:59 pm." },
  { id: "ar-feed", tab: "Archive", targets: ["ar-feed"], title: "Everyone’s picks", body: "Your circles’ photos show up here, then the photo of the month and the year. No likes, no comments.", next: "Messages" },
  { id: "ms-chats", tab: "Messages", targets: ["ms-chats", "ms-pins", "ms-empty"], title: "Your circle’s chat", body: "Every circle gets its own chat. Everyone who joins lands here." },
  { id: "ms-pins", tab: "Messages", targets: ["ms-pins", "ms-chats", "ms-empty"], title: "Pin your people", body: "Pin your 3 closest circles and 3 closest people up top. React to messages with your real face.", next: "Me" },
  { id: "me-photos", tab: "Me", targets: ["me-photos"], title: "Now & then", body: "Add a photo of you now, and one of you as a kid." },
  { id: "me-bio", tab: "Me", targets: ["me-bio"], title: "Your bio", body: "Write a line about yourself, then answer five questions. The top one changes every week." },
  { id: "me-year", tab: "Me", targets: ["me-year"], title: "Your year", body: "Your photos of the week collect here, and gifts from friends go on your shelf.", next: "Circles" },
];

/** The stops the web runs: all of them. */
export const TOUR_STOPS: readonly Stop[] = STOPS;

const UP_NEXT: Record<TourTab, string> = {
  Circles: "Back to your tree.",
  "Daily 5": "",
  Archive: "See the photo of the week.",
  Messages: "Your circle’s chat.",
  Me: "Your profile.",
};

export const TOUR_DELAY_MS = 2200;
export const DONE_LINE = "Tap a + on your tree to add your 3 ornaments. Everything else is one tap away down here.";

/** `at` is the stop; `onTab` is a tab's last stop after Got it, pointing at the next tab. */
/** `joined`: the circle an invite brought you, which changes the closing line (ONB-22). */
export type TourState = { at: number; onTab: boolean; joined?: string } | { done: true; joined?: string } | null;
export type TourAction = { type: "gotIt" } | { type: "tap" } | { type: "end" };

export const startTour = ({ joined }: { joined?: string } = {}): TourState => ({ at: 0, onTab: false, ...(joined ? { joined } : {}) });
const doneLine = (joined?: string) => (joined ? `${joined} is on your tree now. Check your mailbox, there’s a letter waiting for you.` : DONE_LINE);

/** Does this point at a tab in the nav, so it needs a tap? */
const tapTo = (stop: Stop, onTab: boolean): TourTab | undefined => (stop.id === "planted" ? "Daily 5" : onTab ? stop.next : undefined);

const advance = ({ at, joined }: { at: number; joined?: string }, stops: readonly Stop[]): TourState => {
  const j = joined ? { joined } : {};
  return at + 1 < stops.length ? { at: at + 1, onTab: false, ...j } : { done: true, ...j };
};

export function tourReducer(state: TourState, action: TourAction, stops: readonly Stop[] = TOUR_STOPS): TourState {
  if (action.type === "end") return null;
  if (!state || "done" in state) return state;
  const stop = stops[state.at];
  const needsTap = !!tapTo(stop, state.onTab);
  if (action.type === "tap") return needsTap ? advance(state, stops) : state;
  if (needsTap) return state;
  return stop.next ? { ...state, onTab: true } : advance(state, stops);
}

export type TourView =
  | {
      kind: "stop";
      tab: TourTab;
      targets: readonly string[];
      title: string;
      body: string;
      count: string;
      /** Where you have to tap a tab: the spot's name, the card's line, and the tab it opens. */
      tap?: { label: string; hint: string; to: TourTab };
    }
  | { kind: "done"; tab: "Circles"; title: string; body: string };

export function tourView(state: TourState, stops: readonly Stop[] = TOUR_STOPS): TourView | null {
  if (!state) return null;
  if ("done" in state) return { kind: "done", tab: "Circles", title: "You’re all set", body: doneLine(state.joined) };
  const stop = stops[state.at];
  const to = tapTo(stop, state.onTab);
  const pointing = state.onTab && stop.next;
  return {
    kind: "stop",
    tab: stop.tab,
    targets: to ? [`nav:${to}`] : stop.targets,
    title: pointing ? `Up next: ${stop.next}` : stop.title,
    body: pointing ? UP_NEXT[stop.next!] : stop.body,
    count: `${state.at + 1} of ${stops.length}`,
    tap: to && { label: `Go to ${to}`, hint: `Tap ${to}`, to },
  };
}
