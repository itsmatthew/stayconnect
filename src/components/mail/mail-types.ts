import type { ArtKind } from "../home/types";

/** One dropped photo, ready to draw (docs/specs/mailbox.md). Dates come formatted. */
export type MailItemView = {
  id: string;
  fromName: string;
  /** TODO(server): a stored photo's URL. The demo draws one. */
  art: ArtKind;
  /** The photo's date: "Nov 4, 2019". */
  photoDate: string;
  /** When it was dropped: "Nov 9". */
  sentDay: string;
  /** The postmark's two lines: "NOV 9", "2026". */
  postmark: readonly [string, string];
};

/** One person's new drops, stacked. */
export type EnvelopeView = { kind?: "envelope"; key: string; fromName: string; items: readonly MailItemView[] };

/** A birthday coming up (MAILBOX-11), as the mailbox's card. */
export type BirthdayCardView = {
  kind: "birthday";
  key: string;
  name: string;
  /** Their face, drawn as a CSS background. */
  face: string;
  /** "Friday, Nov 13". */
  dayLong: string;
  /** "in 3 days", "tomorrow", "today". */
  countdown: string;
  /** "Schedule a gift", or "Send a gift" on the day; none once it has passed. */
  action?: string;
  /** Once you've sent them something for it (MAILBOX-12). */
  done?: { title: string; line: string };
};

/** What the new-mail viewer pages through: birthday cards first, then envelopes. */
export type MailPiece = EnvelopeView | BirthdayCardView;

/** A seen birthday reminder among kept mail (MAILBOX-13). */
export type BirthdayTileView = { key: string; name: string; face: string; /** "Fri". */ weekday: string; scheduled: boolean };
