// Your mailbox: photos people dropped for you (docs/specs/mailbox.md). Plain TypeScript.
// Nothing here ever reaches the sender: opening, keeping, removing, blocking and reporting are all invisible to them.

import type { FaceLook } from "./directory";

const DAY = 86_400_000;

/** TODO(server): a dropped photo will be a stored image's URL. The demo draws one instead. */
export type MailPhoto = { kind: "art"; art: string };
export type MailSender = { id: string; name: string; look: FaceLook; inCircle: boolean };
export type LetterStatus = "new" | "kept" | "removed";
/** One dropped photo. `takenAt` is the photo's date; `sentAt` is when it was dropped. */
export type Letter = { id: string; from: MailSender; photo: MailPhoto; takenAt: number; sentAt: number; status: LetterStatus };
export type Report = { letterId: string; personId: string; at: number };
export type InboxState = { letters: Letter[]; blocked: string[]; reports: Report[] };

export const emptyInbox: InboxState = { letters: [], blocked: [], reports: [] };

export type InboxAction =
  | { type: "receive"; letter: Letter }
  | { type: "keep"; ids: readonly string[] }
  | { type: "remove"; ids: readonly string[] }
  | { type: "block"; personId: string }
  | { type: "report"; letterId: string; at: number };

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
  }
}

/** New photos, counted one by one: the mailbox says "3 new photos" even when they share an envelope. */
export const newCount = (state: InboxState) => state.letters.filter((l) => l.status === "new").length;

/** The mailbox's name for screen readers, as designed. */
export const mailboxLabel = (count: number) => (count ? `Your mailbox, ${count} new ${count === 1 ? "photo" : "photos"}` : "Your mailbox, nothing new");

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

/** Kept photos, newest first, under "this week", then each month ("october"), with the year once it isn't this one. */
export function keptGroups(state: InboxState, now: number): { label: string; letters: Letter[] }[] {
  const year = new Date(now).getFullYear();
  const kept = state.letters.filter((l) => l.status === "kept").sort((a, b) => b.sentAt - a.sentAt);
  const groups: { label: string; letters: Letter[] }[] = [];
  for (const l of kept) {
    const label = now - l.sentAt < 7 * DAY ? "this week" : MONTH(l.sentAt, new Date(l.sentAt).getFullYear() !== year);
    const last = groups.at(-1);
    if (last?.label === label) last.letters.push(l);
    else groups.push({ label, letters: [l] });
  }
  return groups;
}

/** TODO(server): only the fake in `local-inbox.ts` exists, so mail arrives only from the demo and the dev control, and reports go nowhere. */
export interface InboxStore {
  load(): Promise<InboxState | undefined>;
  save(state: InboxState): Promise<void>;
}
