// The Sunday check-in (docs/specs/nudges.md, NUDGE-13 to NUDGE-16). Plain TypeScript.
// Your answer stays in this browser and is never sent anywhere, even once there's a server.

export type Mood = "rough" | "meh" | "okay" | "good" | "great";
export const MOODS: readonly { id: Mood; label: string }[] = [
  { id: "rough", label: "Rough" },
  { id: "meh", label: "Meh" },
  { id: "okay", label: "Okay" },
  { id: "good", label: "Good" },
  { id: "great", label: "Great" },
];
export const isMood = (x: unknown): x is Mood => MOODS.some((m) => m.id === x);

/** What you send your check-in people yourself, until the app can (NUDGE-15, TODO(server)). */
export const ROUGH_TEXT = "Having a rough week. Would mean a lot if you checked in on me.";

export type CheckInState =
  | { step: "ask" }
  | { step: "thanks" | "rough" | "tell" | "shared" | "notNow"; mood: Mood };

export type CheckInAction = { type: "answer"; mood: Mood } | { type: "tell" } | { type: "shared" } | { type: "notNow" };

export function checkInReducer(s: CheckInState, a: CheckInAction): CheckInState {
  if (a.type === "answer") return s.step === "ask" ? { step: a.mood === "rough" ? "rough" : "thanks", mood: a.mood } : s;
  if (s.step === "ask") return s;
  if (a.type === "tell" && s.step === "rough") return { step: "tell", mood: s.mood };
  if (a.type === "notNow" && (s.step === "rough" || s.step === "tell")) return { step: "notNow", mood: s.mood };
  if (a.type === "shared" && s.step === "tell") return { step: "shared", mood: s.mood };
  return s;
}
