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
export type EnvelopeView = { key: string; fromName: string; items: readonly MailItemView[] };
