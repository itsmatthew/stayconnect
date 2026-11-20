// Your profile on Me (docs/specs/me.md, ME-5 to ME-8): the line about you, the five questions and who sees each memory.
// Plain TypeScript: no React or browser APIs, for the mobile app too. Photos live with the ornaments (`ME_PROFILE`).

import { isoWeek } from "../archive/periods";

export const BIO_MAX = 60;
export const ANSWER_MAX = 40;

/** Who sees a self-defining memory (ME-8). */
export type Audience = "circles" | "nest";

export type Profile = {
  bio: string;
  /** By question id; this week's question's id carries its week, so its answer belongs to that week. */
  answers: Record<string, string>;
  audience: readonly [Audience, Audience, Audience];
};

export type ProfileAction =
  | { type: "bio"; text: string }
  | { type: "answer"; id: string; text: string }
  | { type: "audience"; index: number; audience: Audience };

export const emptyProfile = (): Profile => ({ bio: "", answers: {}, audience: ["circles", "circles", "circles"] });

/** One line: spaces tidied, cut to `max`. */
export const tidyLine = (text: string, max: number) => text.replace(/\s+/g, " ").trim().slice(0, max).trim();

/** The four that always stay, in the design's colors (ME-7). */
export const FIXED_QUESTIONS = [
  { id: "smells", text: "Smells like childhood?", color: "#B43A2A" },
  { id: "feel", text: "Wish I could feel again?", color: "#B5650E" },
  { id: "spot", text: "My spot growing up?", color: "#4F7A36" },
  { id: "hill", text: "Hill I’d die on?", color: "#2F6FA8" },
] as const;

// TODO(design): a stand-in bank until the designer's list. Week 46 lands on the design's Thanksgiving question.
const WEEKLY_BANK = [
  "First concert?",
  "Best summer job?",
  "Go-to karaoke song?",
  "Childhood TV show?",
  "Snack you’d never share?",
  "Most-worn shirt?",
  "Road trip snack?",
  "Favorite Thanksgiving dish?",
  "Best birthday?",
  "First car?",
  "Song that takes you back?",
  "Worst haircut year?",
  "Teacher you still think about?",
];

export function weeklyQuestion(now: number): { id: string; week: number; text: string } {
  const { year, week } = isoWeek(now);
  return { id: `week:${year}-W${week}`, week, text: WEEKLY_BANK[week % WEEKLY_BANK.length] };
}

export type ProfileQuestion = { id: string; text: string; color: string; answer?: string; week?: number };

/** This week's question first, then the four that stay, with your answers. */
export function profileQuestions(p: Profile, now: number): ProfileQuestion[] {
  const w = weeklyQuestion(now);
  return [
    { id: w.id, text: w.text, color: "#2B3350", week: w.week, answer: p.answers[w.id] },
    ...FIXED_QUESTIONS.map((q) => ({ id: q.id, text: q.text, color: q.color, answer: p.answers[q.id] })),
  ];
}

export function profileReducer(p: Profile, a: ProfileAction): Profile {
  switch (a.type) {
    case "bio":
      return { ...p, bio: tidyLine(a.text, BIO_MAX) };
    case "answer": {
      const text = tidyLine(a.text, ANSWER_MAX);
      const { [a.id]: _old, ...rest } = p.answers;
      void _old;
      return { ...p, answers: text ? { ...rest, [a.id]: text } : rest };
    }
    case "audience": {
      const audience = [...p.audience] as [Audience, Audience, Audience];
      audience[a.index] = a.audience;
      return { ...p, audience };
    }
  }
}

const isAudience = (v: unknown): v is Audience => v === "circles" || v === "nest";

/** A saved profile, keeping what's sound and dropping the rest. */
export function validProfile(v: unknown): Profile {
  const empty = emptyProfile();
  if (!v || typeof v !== "object") return empty;
  const { bio, answers, audience } = v as Record<string, unknown>;
  const a = Array.isArray(audience) ? audience : [];
  return {
    bio: typeof bio === "string" ? bio : "",
    answers: answers && typeof answers === "object" && !Array.isArray(answers) ? Object.fromEntries(Object.entries(answers).filter(([, t]) => typeof t === "string")) : {},
    audience: [0, 1, 2].map((i) => (isAudience(a[i]) ? a[i] : "circles")) as unknown as Profile["audience"],
  };
}

/** Your profile's photos are kept with the ornaments, under this id (ME-5, ME-8). */
export const ME_PROFILE = "me-profile";

export interface ProfileStore {
  load(): Promise<Profile>;
  save(p: Profile): Promise<void>;
}
