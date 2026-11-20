// Your mailbox: photos people dropped for you (docs/specs/mailbox.md). Plain TypeScript.
// Nothing here ever reaches the sender: opening, keeping, removing, blocking and reporting are all invisible to them.

import { reminderId, type Upcoming } from "./birthdays";
import type { FaceLook } from "./directory";

const DAY = 86_400_000;

/** TODO(server): a dropped photo will be a stored image's URL. The demo draws one instead. */
export type MailPhoto = { kind: "art"; art: string };
export type MailSender = { id: string; name: string; look: FaceLook; inCircle: boolean };
export type LetterStatus = "new" | "kept" | "removed";
/** One dropped photo. `takenAt` is the photo's date; `sentAt` is when it was dropped. */
export type Letter = { id: string; from: MailSender; photo: MailPhoto; takenAt: number; sentAt: number; status: LetterStatus };
export type Report = { letterId: string; personId: string; at: number };
/** A birthday reminder you've seen: it's kept with your photos (MAILBOX-13). */
export type SeenReminder = { id: string; personId: string; day: string; at: number };
/** A gift you sent someone for their birthday, from anywhere in the app (MAILBOX-12). */
export type BirthdayGift = { personId: string; day: string };
/** The welcome letter a new person finds in their mailbox (docs/specs/onboarding.md, ONB-1): its day, and whether it's been read. */
export type Welcome = { at: number; status: "new" | "kept" };
export type InboxState = { letters: Letter[]; blocked: string[]; reports: Report[]; seen: SeenReminder[]; birthdayGifts: BirthdayGift[]; welcome?: Welcome };

export const emptyInbox: InboxState = { letters: [], blocked: [], reports: [], seen: [], birthdayGifts: [] };

/** Mail saved before birthdays existed has no reminders yet. */
export const withInboxDefaults = (s: InboxState): InboxState => ({ ...s, seen: s.seen ?? [], birthdayGifts: s.birthdayGifts ?? [] });

export type InboxAction =
  | { type: "receive"; letter: Letter }
  | { type: "keep"; ids: readonly string[] }
  | { type: "remove"; ids: readonly string[] }
  | { type: "block"; personId: string }
  | { type: "report"; letterId: string; at: number }
  | { type: "seeReminder"; personId: string; day: string; at: number }
  | { type: "birthdayGift"; personId: string; day: string }
  | { type: "welcome"; at: number }
  | { type: "readWelcome" };

const setStatus = (letters: Letter[], ids: readonly string[], status: LetterStatus) => letters.map((l) => (ids.includes(l.id) ? { ...l, status } : l));

export function inboxReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case "receive": {
      const { letter } = action;
      // A blocked person's drops never arrive (MAILBOX-7).
      if (state.blocked.includes(letter.from.id) || state.letters.some((l) => l.id === letter.id)) return state;
      return { ...state, letters: [...state.letters, { ...letter, status: "new" }] };
    }
    case "keep":
      return { ...state, letters: setStatus(state.letters, action.ids, "kept") };
    case "remove":
      return { ...state, letters: setStatus(state.letters, action.ids, "removed") };
    case "block": {
      const theirs = state.letters.filter((l) => l.from.id === action.personId).map((l) => l.id);
      const blocked = state.blocked.includes(action.personId) ? state.blocked : [...state.blocked, action.personId];
      return { ...state, blocked, letters: setStatus(state.letters, theirs, "removed") };
    }
    case "report": {
      const l = state.letters.find((x) => x.id === action.letterId);
      if (!l) return state;
      return { ...state, reports: [...state.reports, { letterId: l.id, personId: l.from.id, at: action.at }], letters: setStatus(state.letters, [l.id], "removed") };
    }
    case "seeReminder": {
      const id = reminderId(action.personId, action.day);
      if (state.seen.some((r) => r.id === id)) return state;
      return { ...state, seen: [...state.seen, { id, personId: action.personId, day: action.day, at: action.at }] };
    }
    case "birthdayGift": {
      if (hasBirthdayGift(state, action.personId, action.day)) return state;
      return { ...state, birthdayGifts: [...state.birthdayGifts, { personId: action.personId, day: action.day }] };
    }
    // The welcome letter comes once, and once read it's kept (ONB-1, ONB-6).
    case "welcome":
      return state.welcome ? state : { ...state, welcome: { at: action.at, status: "new" } };
    case "readWelcome":
      return state.welcome?.status === "new" ? { ...state, welcome: { ...state.welcome, status: "kept" } } : state;
  }
}

/** Someone with no circles who has never had the welcome letter gets one (ONB-1). */
export const welcomeDue = (state: InboxState, circles: number) => !state.welcome && circles === 0;

/** The welcome letter is waiting to be read (ONB-3). */
export const welcomeIsNew = (state: InboxState) => state.welcome?.status === "new";

/** New photos, counted one by one: the mailbox says "3 new photos" even when they share an envelope. */
export const newCount = (state: InboxState) => state.letters.filter((l) => l.status === "new").length;

/** Birthdays coming up that you haven't seen yet: new mail (MAILBOX-11). */
export const newReminders = (upcoming: readonly Upcoming[], state: InboxState) => upcoming.filter((u) => !state.seen.some((r) => r.id === reminderId(u.personId, u.day)));

/** You've sent them a gift for this birthday (MAILBOX-12). */
export const hasBirthdayGift = (state: InboxState, personId: string, day: string) => state.birthdayGifts.some((g) => g.personId === personId && g.day === day);

/** The mailbox's name for screen readers, as designed: the welcome letter (ONB-3), new photos, and birthdays coming up. */
export function mailboxLabel(photos: number, birthdays = 0, welcome = false): string {
  const p = `${photos} new ${photos === 1 ? "photo" : "photos"}`;
  const b = `${birthdays} ${birthdays === 1 ? "birthday" : "birthdays"}`;
  if (welcome) {
    const rest = [photos ? p : "", birthdays ? b : ""].filter(Boolean);
    if (rest.length === 2) return `Your mailbox, a welcome letter, ${rest.join(" and ")}`;
    if (birthdays) return `Your mailbox, a welcome letter and ${b} coming up`;
    return rest.length ? `Your mailbox, a welcome letter and ${p}` : "Your mailbox, a welcome letter";
  }
  if (photos && birthdays) return `Your mailbox, ${p} and ${b}`;
  if (photos) return `Your mailbox, ${p}`;
  if (birthdays) return `Your mailbox, ${b} coming up`;
  return "Your mailbox, nothing new";
}

/** One person's new drops, stacked (MAILBOX-3). */
export type Envelope = { key: string; from: MailSender; letters: Letter[] };

/** New mail, one envelope per person: photos oldest first inside, envelopes in the order their first photo came. */
export function envelopes(state: InboxState): Envelope[] {
  const fresh = state.letters.filter((l) => l.status === "new").sort((a, b) => a.sentAt - b.sentAt);
  const byPerson = new Map<string, Envelope>();
  for (const l of fresh) {
    const e = byPerson.get(l.from.id);
    if (e) e.letters.push(l);
    else byPerson.set(l.from.id, { key: l.from.id, from: l.from, letters: [l] });
  }
  return [...byPerson.values()];
}

const MONTH = (t: number, withYear: boolean) => new Date(t).toLocaleDateString("en-US", withYear ? { month: "long", year: "numeric" } : { month: "long" }).toLowerCase();

/** `welcome`: the read welcome letter belongs to this group, shown before its photos (ONB-6). */
export type KeptGroup = { label: string; letters: Letter[]; reminders: SeenReminder[]; welcome?: true };

/**
 * Kept photos and seen birthday reminders, newest first, under "this week", then each month ("october"), with the year
 * once it isn't this one. In a group, photos come before reminders, as designed.
 */
export function keptGroups(state: InboxState, now: number): KeptGroup[] {
  const year = new Date(now).getFullYear();
  const labelOf = (t: number) => (now - t < 7 * DAY ? "this week" : MONTH(t, new Date(t).getFullYear() !== year));
  const items = [
    ...state.letters.filter((l) => l.status === "kept").map((l) => ({ at: l.sentAt, letter: l })),
    ...state.seen.map((r) => ({ at: r.at, reminder: r })),
    ...(state.welcome?.status === "kept" ? [{ at: state.welcome.at, welcome: true as const }] : []),
  ].sort((a, b) => b.at - a.at);
  const groups: KeptGroup[] = [];
  for (const item of items) {
    const label = labelOf(item.at);
    let g = groups.at(-1);
    if (g?.label !== label) groups.push((g = { label, letters: [], reminders: [] }));
    if ("letter" in item) g.letters.push(item.letter);
    else if ("reminder" in item) g.reminders.push(item.reminder);
    else g.welcome = true;
  }
  return groups;
}

/** TODO(server): only the fake in `local-inbox.ts` exists, so mail arrives only from the demo and the dev control, and reports go nowhere. */
export interface InboxStore {
  load(): Promise<InboxState | undefined>;
  save(state: InboxState): Promise<void>;
}
