// Starting a circle (docs/specs/onboarding.md, ONB-7 to ONB-12). Plain TypeScript: no React or browser APIs.

import { resolveColorsForViewer, suggestGroupColor, type ViewerGroup } from "../colors/group-colors";
import { GROUP_COLORS } from "../colors/palette";

export type LogoStyle = "crest" | "badge" | "varsity";
/** 1 name and color, 2 logo, 3 now & then, 4 invite, 5 live. */
export type Step = 1 | 2 | 3 | 4 | 5;
/** `P` is however the app holds a picked photo. */
export type Draft<P> = { step: Step; name: string; colorId: string; logo: LogoStyle; now?: P; then?: P; shared?: "shared" | "copied" };

export const NAME_MAX = 22;

export type StartAction<P> =
  | { type: "name"; name: string }
  | { type: "color"; colorId: string }
  | { type: "logo"; logo: LogoStyle }
  | { type: "photo"; slot: "now" | "then"; photo: P }
  | { type: "next" }
  | { type: "back" }
  | { type: "shared"; how: "shared" | "copied" };

/** A fresh draft: the color your circles use least is picked (COLOR-3), and the crest. */
export function startDraft<P>(myColors: readonly string[]): Draft<P> {
  return { step: 1, name: "", colorId: suggestGroupColor(myColors), logo: "crest" };
}

/** The name as it'll be saved: trimmed, at most 22 characters. */
export const cleanName = (name: string) => name.trim().slice(0, NAME_MAX);

/** Step 1 can go on once the name has a letter or digit (ONB-8). */
export const nameReady = (name: string) => /[\p{L}\p{N}]/u.test(name);

export function startReducer<P>(d: Draft<P>, a: StartAction<P>): Draft<P> {
  switch (a.type) {
    case "name":
      return { ...d, name: a.name.slice(0, NAME_MAX) };
    case "color":
      return GROUP_COLORS.some((c) => c.id === a.colorId) ? { ...d, colorId: a.colorId } : d;
    case "logo":
      return { ...d, logo: a.logo };
    case "photo":
      return { ...d, [a.slot]: a.photo };
    case "next":
      // The invite step moves on only once it's shared (ONB-11).
      if (d.step === 1 && !nameReady(d.name)) return d;
      if (d.step >= 4) return d;
      return { ...d, step: (d.step + 1) as Step };
    case "back":
      return d.step > 1 && d.step < 5 ? { ...d, step: (d.step - 1) as Step } : d;
    case "shared":
      return d.step === 4 ? { ...d, step: 5, shared: a.how } : d;
  }
}

/** The message sent with the invite link (ONB-11). */
export const inviteMessage = (name: string) => `saved you a spot on our tree 🌲 come join ${cleanName(name)}`;

/**
 * The circle that already has this color on your screen, if any: yours then gets the next shade (ONB-8, COLOR-6).
 * `shade` is the one the new circle would get.
 */
export function colorClash(colorId: string, mine: readonly (ViewerGroup & { name: string })[], now: number): { name: string; shade: number } | undefined {
  const draft = { id: "\u0000new", colorId, joinedAt: now + 1 };
  const shade = resolveColorsForViewer([...mine, draft])[draft.id]?.shade ?? 0;
  if (!shade) return undefined;
  const first = [...mine].filter((g) => g.colorId === colorId).sort((a, b) => a.joinedAt - b.joinedAt)[0];
  return first && { name: first.name, shade };
}
