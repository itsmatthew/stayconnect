import { CAVEAT } from "../home/units";

/** Handwriting ids to fonts. On mobile these are the same font files through expo-font. */
export const HAND_FONTS: Readonly<Record<string, string>> = {
  caveat: CAVEAT,
  shadows: "var(--font-gift-shadows), 'Comic Sans MS', cursive",
  homemade: "var(--font-gift-homemade), 'Comic Sans MS', cursive",
};

/** The handwritten size for each font, so all three read at about the same size. */
export const HAND_SCALE: Readonly<Record<string, number>> = { caveat: 1, shadows: 0.95, homemade: 0.72 };
