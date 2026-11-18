import { CAVEAT } from "../home/units";

export type HandLook = { family: string; weight: number; /** The note on the postcard. */ size: number; lh: number; /** The sample in its choice tile. */ sample: number; /** The address and Instant's date. */ caption: number };

/** Handwriting ids to fonts and sizes, from the design. On mobile these are the same font files through expo-font. */
export const HAND_LOOKS: Readonly<Record<string, HandLook>> = {
  pen: { family: CAVEAT, weight: 600, size: 21, lh: 1.12, sample: 22, caption: 19 },
  pencil: { family: "var(--font-gift-pencil), 'Comic Sans MS', cursive", weight: 400, size: 23, lh: 1, sample: 24, caption: 21 },
  script: { family: "var(--font-gift-script), 'Comic Sans MS', cursive", weight: 400, size: 12, lh: 1.75, sample: 12, caption: 11 },
};

export const handLook = (id: string) => HAND_LOOKS[id] ?? HAND_LOOKS.pen;

/** The date stamp's dot-matrix digits. */
export const STAMP_FONT = "var(--font-gift-stamp), VT323, monospace";

/** Shared colors from the design. */
export const PAPER_PANEL = "#F7EFD6";
export const TILE = "#EADDB8";
export const TILE_ON = "#FFF6DA";
export const NOTE_GREY = "#5C5442";
export const RED = "#B43A2A";
