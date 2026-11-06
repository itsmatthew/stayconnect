// A gift being made, and the maker's rules (docs/specs/gifts.md). Plain TypeScript: the mobile app imports this unchanged.

export const STEPS = ["to", "photo", "frame", "note", "wrap"] as const;
export type GiftStep = (typeof STEPS)[number];

export const NOTE_MAX = 140;

/** A gift goes to one person, or to a group: one gift, one price, a copy for each member (GIFT-13). */
export type GiftRecipient = { kind: "person"; id: string } | { kind: "group"; id: string };
export type GiftPhoto = { kind: "stored"; photoId: string } | { kind: "art"; art: string };
export type GiftOpens = { kind: "now" } | { kind: "on"; /** Local "YYYY-MM-DD". */ day: string };
export type GiftStatus = "draft" | "paying" | "paid" | "sent";

/** Looks are stored as catalog ids, never styles, so an item can change or become paid without touching saved gifts (GIFT-10). */
export type Gift = {
  /** Also the payment's idempotency key. */
  id: string;
  /** Absent until someone is picked. */
  to?: GiftRecipient;
  from: string;
  photo?: GiftPhoto;
  takenAt?: number;
  /** `takenAt` is the file's modified date, not a capture date (D5-4). */
  fileDated?: true;
  frame: { id: string; dateStamp: boolean };
  note: { text: string; hand: string; ink: string; stamp: string };
  wrap: { pattern: string; ribbon: string };
  opens: GiftOpens;
  status: GiftStatus;
  /** Where the maker was, to pick up from. */
  step: GiftStep;
  createdAt: number;
};

export type GiftAction =
  | { type: "to"; to: GiftRecipient }
  | { type: "photo"; photo: GiftPhoto; takenAt?: number; fileDated?: true }
  | { type: "frame"; id: string }
  | { type: "dateStamp"; on: boolean }
  | { type: "note"; text: string }
  | { type: "hand"; id: string }
  | { type: "ink"; id: string }
  | { type: "stamp"; id: string }
  | { type: "pattern"; id: string }
  | { type: "ribbon"; id: string }
  | { type: "opens"; opens: GiftOpens }
  | { type: "step"; step: GiftStep };

export function newGift({ id, from, now }: { id: string; from: string; now: number }): Gift {
  return {
    id,
    from,
    frame: { id: "classic", dateStamp: false },
    note: { text: "", hand: "caveat", ink: "navy", stamp: "tree" },
    wrap: { pattern: "candy", ribbon: "gold" },
    opens: { kind: "now" },
    status: "draft",
    step: "to",
    createdAt: now,
  };
}

/** Counts code points, so an emoji is one. */
export const noteLength = (text: string) => [...text].length;
export const clampNote = (text: string) => [...text].slice(0, NOTE_MAX).join("");

/** The stamp prints a capture date, so a photo dated only by its file can't have one (GIFT-6). */
export const dateStampAllowed = (g: Pick<Gift, "takenAt" | "fileDated">) => g.takenAt !== undefined && !g.fileDated;

export function giftReducer(gift: Gift, action: GiftAction): Gift {
  switch (action.type) {
    case "to":
      return { ...gift, to: action.to };
    case "photo": {
      // The date belongs to the photo, so a new photo replaces it, even with nothing.
      const { photo, takenAt, fileDated } = action;
      return { ...gift, photo, takenAt, fileDated, frame: { ...gift.frame, dateStamp: dateStampAllowed({ takenAt, fileDated }) } };
    }
    case "frame":
      return { ...gift, frame: { ...gift.frame, id: action.id } };
    case "dateStamp":
      return { ...gift, frame: { ...gift.frame, dateStamp: action.on && dateStampAllowed(gift) } };
    case "note":
      return { ...gift, note: { ...gift.note, text: clampNote(action.text) } };
    case "hand":
      return { ...gift, note: { ...gift.note, hand: action.id } };
    case "ink":
      return { ...gift, note: { ...gift.note, ink: action.id } };
    case "stamp":
      return { ...gift, note: { ...gift.note, stamp: action.id } };
    case "pattern":
      return { ...gift, wrap: { ...gift.wrap, pattern: action.id } };
    case "ribbon":
      return { ...gift, wrap: { ...gift.wrap, ribbon: action.id } };
    case "opens":
      return { ...gift, opens: action.opens };
    case "step":
      return { ...gift, step: action.step };
  }
}

const stepDone = (gift: Gift, step: GiftStep, today: string): boolean => {
  switch (step) {
    case "to":
      return !!gift.to;
    case "photo":
      return !!gift.photo;
    case "wrap":
      return gift.opens.kind === "now" || gift.opens.day > today;
    default:
      return true;
  }
};

export const canContinue = (gift: Gift, today: string) => stepDone(gift, gift.step, today);

/** Any step up to the first unfinished one. */
export const canOpenStep = (gift: Gift, step: GiftStep, today: string) => STEPS.slice(0, STEPS.indexOf(step)).every((s) => stepDone(gift, s, today));

export const nextStep = (step: GiftStep): GiftStep | undefined => STEPS[STEPS.indexOf(step) + 1];
export const previousStep = (step: GiftStep): GiftStep | undefined => STEPS[STEPS.indexOf(step) - 1];

/** What one recipient receives. Each has their own id, so each is unwrapped and kept on its own. */
export type GiftCopy = { id: string; giftId: string; to: string };

/** Everyone who gets a copy: the person, or each member of the group but the sender. Call it when sending, so later joiners get none (GIFT-13). */
export function giftCopies(gift: Gift, membersOf: (groupId: string) => readonly string[]): GiftCopy[] {
  if (!gift.to) return [];
  const people = gift.to.kind === "person" ? [gift.to.id] : membersOf(gift.to.id);
  return [...new Set(people)].filter((id) => id !== gift.from).map((to) => ({ id: `${gift.id}/${to}`, giftId: gift.id, to }));
}

/** One charge per gift, whoever it's for: a group gift costs the same as a gift to one person (GIFT-13). */
export const giftCharge = (gift: Pick<Gift, "id">) => ({ idempotencyKey: gift.id, sku: "gift.single", quantity: 1 });

export type GiftSide = "photo" | "postcard" | "wrapped";

/** What the live card shows on each step (GIFT-3). */
export function defaultSide(step: GiftStep): GiftSide {
  if (step === "wrap") return "wrapped";
  return step === "photo" || step === "frame" ? "photo" : "postcard";
}

/** The draft to pick up: the newest one not yet paid for. */
export const newestDraft = (gifts: readonly Gift[]): Gift | undefined =>
  gifts.filter((g) => g.status === "draft").reduce<Gift | undefined>((best, g) => (!best || g.createdAt > best.createdAt ? g : best), undefined);

/** Newest first, `limit` of them. */
export const newestPhotos = <T extends { takenAt: number }>(photos: readonly T[], limit: number) => [...photos].sort((a, b) => b.takenAt - a.takenAt).slice(0, limit);

const pad = (n: number) => String(n).padStart(2, "0");

/** A local "YYYY-MM-DD". */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const dayDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const dayAfter = (day: string) => {
  const d = dayDate(day);
  d.setDate(d.getDate() + 1);
  return dayKey(d.getTime());
};

/** "Thu, Nov 12". */
export const dayLabel = (day: string) => dayDate(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
/** "Nov 12". */
export const shortDay = (day: string) => dayDate(day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** "’26": what old cameras printed. */
export const shortYear = (t: number) => `’${String(new Date(t).getFullYear()).slice(-2)}`;
/** "Nov 5, 2026". */
export const writtenDate = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
/** "NOV 6 2026". */
export const postmark = (t: number) => writtenDate(t).replace(",", "").toUpperCase();
