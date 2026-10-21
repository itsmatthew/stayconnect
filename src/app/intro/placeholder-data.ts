// TODO(re-evaluate when groups come from the database): swap this file for real data.
// Every placeholder in the app lives here: groups (docs/specs/home.md, HOME-1), friends,
// their rings in Your circle (docs/specs/circle.md), seed conversations, the replies "simulate reply" uses (docs/specs/messages.md) and Archive posts
// (docs/specs/archive.md). Only app-data.ts imports it, behind the demo switch (docs/specs/demo.md).

import type { ArtKind, CircleGroup, Friend, Palette } from "@/components/home/types";
import type { Placements } from "./circle/rings";
import { isOpen, periodsOfYear } from "./archive/periods";
import type { ArchivePost } from "./archive/posts";
import { ME, type ChatMessage, type Conversation } from "./messages/conversations";

const red: Palette = { canopy: "#C8432B", shade: "#93281A", highlight: "#F3A088", rim: "#FFD2C4" };
const green: Palette = { canopy: "#5E8068", shade: "#3F5F4C", highlight: "#B8D2BE", rim: "#D6F0DC" };
const amber: Palette = { canopy: "#E3A22F", shade: "#B97814", highlight: "#FBE2A0", rim: "#FFF0BE" };
const purple: Palette = { canopy: "#9A4FB0", shade: "#6B2F80", highlight: "#D7AEE3", rim: "#F0DDF6" };
const orange: Palette = { canopy: "#E8792E", shade: "#A8501A", highlight: "#F7B98A", rim: "#FFE3CC" };
const blue: Palette = { canopy: "#3F86C4", shade: "#285E92", highlight: "#A9CFEF", rim: "#D8ECFB" };
const rust: Palette = { canopy: "#B85A2E", shade: "#82391A", highlight: "#EBA684", rim: "#FADACB" };

export const friends: readonly Friend[] = [
  { id: "leo", name: "Leo", closest: true, look: { skin: "#EDB98F", hair: "#6B3F23", shirt: "#2B3350", bg: "#CFE0F4", ring: "#3F9AD8" } },
  { id: "priya", name: "Priya", closest: true, look: { skin: "#B9825A", hair: "#1F1A1A", shirt: "#C8432B", bg: "#F8CFC2", ring: "#C8432B" } },
  { id: "ana", name: "Ana", closest: true, look: { skin: "#F1C7A0", hair: "#C98A3C", shirt: "#4F8A3C", bg: "#D5E9C6", ring: "#4F8A3C" } },
  { id: "sam", name: "Sam", closest: false, look: { skin: "#E8B58C", hair: "#2A1C14", shirt: "#EBA22E", bg: "#FCE6B8", ring: "#EBA22E" } },
  { id: "jordan", name: "Jordan", closest: false, look: { skin: "#8D5A3B", hair: "#1F1A1A", shirt: "#4F8F8B", bg: "#CFE6E2", ring: "#4F8F8B" } },
  { id: "nico", name: "Nico", closest: false, look: { skin: "#F1C7A0", hair: "#B8562E", shirt: "#7A4E8C", bg: "#E6D8F2", ring: "#7A4E8C" } },
  { id: "mom", name: "Mom", closest: false, look: { skin: "#EDB98F", hair: "#8A8A8A", shirt: "#3F86C4", bg: "#D8ECFB", ring: "#3F86C4" } },
  { id: "dad", name: "Dad", closest: false, look: { skin: "#EDB98F", hair: "#4A3A2A", shirt: "#5E8068", bg: "#D6F0DC", ring: "#5E8068" } },
  { id: "grandma", name: "Grandma", closest: false, look: { skin: "#F1C7A0", hair: "#D9D4CC", shirt: "#9A4FB0", bg: "#F0DDF6", ring: "#9A4FB0" } },
];

/** Who's in which ring, each ring in order. Leo's recent chat earns him a "move to Nest?" suggestion (CIRCLE-9). */
export const placeholderRings: Placements = {
  mom: "nest",
  priya: "nest",
  ana: "nest",
  leo: "branches",
  sam: "branches",
  dad: "branches",
  jordan: "bloom",
  nico: "bloom",
  grandma: "bloom",
};

// Captions break onto two lines at "\n", as in the reference card.
// Closest circles first, in the order they're pinned; then the other groups.
export const placeholderGroups: readonly CircleGroup[] = [
  {
    id: "madrid-crew",
    name: "Madrid Crew",
    palette: red,
    closest: true,
    members: ["leo", "ana", "nico"],
    friendCount: 6,
    memories: [
      { id: "madrid-1", art: "city", caption: "rooftop,\nlast night" },
      { id: "madrid-2", art: "churro", caption: "the 4am\nchurro run" },
      { id: "madrid-3", art: "faces", caption: "wrong line,\ntwice" },
    ],
    lastMemory: "last memory 2 days ago",
  },
  {
    id: "hoops-since-14",
    name: "Hoops Since ’14",
    palette: amber,
    closest: true,
    members: ["sam", "jordan", "leo"],
    friendCount: 5,
    memories: [
      { id: "hoops-1", art: "basketball", caption: "buzzer\nbeater" },
      { id: "hoops-2", art: "sunset", caption: "the 6am\nrun" },
      { id: "hoops-3", art: "people", caption: "post-game\ntacos" },
    ],
    lastMemory: "last memory yesterday",
  },
  {
    id: "apt-4b",
    name: "Apt 4B",
    palette: green,
    closest: true,
    members: ["priya", "ana"],
    friendCount: 3,
    memories: [
      { id: "apt-1", art: "people", caption: "the couch\nmove" },
      { id: "apt-2", art: "cookie", caption: "burnt\npancakes" },
      { id: "apt-3", art: "sunset", caption: "move-in\nday" },
    ],
    lastMemory: "last memory 5 days ago",
  },
  {
    id: "family",
    name: "Family",
    palette: blue,
    closest: true,
    members: ["mom", "dad", "grandma"],
    // Grandma sees everyone's Archive posts without posting (ARC-5).
    viewers: ["grandma"],
    friendCount: 4,
    memories: [
      { id: "family-1", art: "sunset", caption: "lake house,\nevery july" },
      { id: "family-2", art: "cookie", caption: "grandma’s\nrecipe" },
      { id: "family-3", art: "faces", caption: "the ski\ntrip" },
    ],
    lastMemory: "last memory 4 days ago",
  },
  {
    id: "uni-mates",
    name: "Uni Mates",
    palette: purple,
    closest: false,
    members: ["priya", "jordan"],
    friendCount: 2,
    memories: [
      { id: "uni-1", art: "city", caption: "library,\n2am" },
      { id: "uni-2", art: "churro", caption: "finals week\nfuel" },
      { id: "uni-3", art: "faces", caption: "grad day,\nfinally" },
    ],
    lastMemory: "last memory 3 weeks ago",
  },
  {
    id: "work-mates",
    name: "Work Mates",
    palette: orange,
    closest: false,
    members: ["sam", "nico"],
    friendCount: 5,
    memories: [
      { id: "work-1", art: "people", caption: "offsite\nkaraoke" },
      { id: "work-2", art: "cookie", caption: "bake-off,\nlost" },
      { id: "work-3", art: "faces", caption: "the great\ndesk swap" },
    ],
    lastMemory: "last memory 1 week ago",
  },
  {
    id: "fall-24",
    name: "Fall 24",
    palette: rust,
    closest: false,
    members: ["jordan", "ana", "nico"],
    friendCount: 3,
    memories: [
      { id: "fall-1", art: "basketball", caption: "first\ntailgate" },
      { id: "fall-2", art: "sunset", caption: "orientation\nweek" },
      { id: "fall-3", art: "people", caption: "dorm\nmove-in" },
    ],
    lastMemory: "last memory 2 weeks ago",
  },
];

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Seed chats, timed back from `now`. `opened` is how long ago the user last opened the chat. */
export function seedConversations(now: number): Conversation[] {
  const chat = (id: string, opened: number | null, lines: [from: string, ago: number, text: string][]): Conversation => ({
    id,
    lastOpenedAt: opened === null ? 0 : now - opened,
    messages: lines.map(([from, ago, text], i): ChatMessage => ({ id: `${id}/seed-${i}`, kind: "text", from, at: now - ago, text })),
  });
  return [
    chat("group:madrid-crew", 20 * HOUR, [
      ["leo", 26 * HOUR, "rooftop again friday?"],
      ["ana", 25.5 * HOUR, "only if we skip the 4am churros"],
      [ME, 25 * HOUR, "we are not skipping the churros"],
    ]),
    chat("group:hoops-since-14", null, [
      ["jordan", 4 * HOUR, "court’s open saturday"],
      ["sam", 3 * HOUR, "6am run tmrw?"],
    ]),
    chat("group:apt-4b", 1 * DAY, [["priya", 2 * DAY, "who left the oven on"]]),
    chat("group:family", 2 * HOUR, [["mom", 5 * HOUR, "call your grandma!"]]),
    chat("friend:leo", null, [
      ["leo", 12 * DAY, "found the taco place from madrid. in brooklyn??"],
      [ME, 12 * DAY - 2 * HOUR, "no way. saturday?"],
      ["leo", 9 * DAY, "saturday. bring the good camera"],
      [ME, 8 * DAY, "that was the best day in months"],
      [ME, 3 * DAY, "we're doing the rooftop again before it gets cold"],
      ["leo", 1 * HOUR, "send me that pic from the rooftop"],
    ]),
    chat("friend:priya", 20 * HOUR, [
      ["priya", 31 * HOUR, "text me when you land"],
      [ME, 30 * HOUR, "landed!"],
    ]),
    chat("group:fall-24", null, [["jordan", 40 * MIN, "who has the tailgate tent"]]),
    chat("friend:sam", 5 * HOUR, [["sam", 6 * HOUR, "pull up"]]),
    chat("group:uni-mates", 20 * HOUR, [["priya", 26 * HOUR, "library at 8?"]]),
    chat("group:work-mates", 3 * DAY, [["nico", 4 * DAY, "karaoke rematch?"]]),
  ];
}

/** What a recipient says when the dev-only "simulate reply" fires (docs/specs/messages.md, MSG-6). */
export const placeholderReplies: readonly string[] = [
  "omg I forgot about this day",
  "WAIT where did you find this",
  "we need to do this again",
  "look at us 😭",
];

const ARTS: readonly ArtKind[] = ["sunset", "people", "city", "faces", "basketball", "cookie", "churro"];
const CAPTIONS: readonly string[] = [
  "the 6am run, finally",
  "rooftop, no plans",
  "first snow, sort of",
  "we found the good tacos",
  "grandma's kitchen, again",
  "drove too far for this sunset",
];

/** A small, stable hash so the same period always gets the same placeholder posts. */
function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * Archive posts for last year and this one, up to `now` (docs/specs/archive.md).
 * Friends post most periods (viewers never do). You've posted every ended period except a few weeks,
 * so the missed ones show as closed, and you haven't posted anything that's still open.
 */
export function placeholderPosts(now: number): ArchivePost[] {
  const year = new Date(now).getFullYear();
  const posters = friends.filter((f) => !placeholderGroups.some((g) => g.viewers?.includes(f.id)));
  return [year - 1, year].flatMap((y) =>
    periodsOfYear(y).flatMap((period) => {
      const open = isOpen(period, now);
      if (!open && period.end > now) return [];
      // The yearly post opens in December.
      const from = period.kind === "year" ? new Date(period.year, 11, 1).getTime() : period.start;
      const until = Math.min(period.end, now);
      const make = (author: string): ArchivePost => {
        const h = hash(`${author}/${period.key}`);
        const postedAt = Math.floor(from + ((h % 1000) / 1000) * (until - from));
        return {
          id: `placeholder/${author}/${period.key}`,
          author,
          period: period.key,
          postedAt,
          takenAt: Math.max(from, postedAt - (h % 7) * 3_600_000),
          photo: { kind: "art", art: ARTS[h % ARTS.length] },
          // About a third carry a caption (ARC-13).
          ...(h % 3 === 0 ? { caption: CAPTIONS[(h >>> 3) % CAPTIONS.length] } : {}),
        };
      };
      const theirs = posters.filter((f) => hash(`${f.id}/${period.key}`) % 4 !== 0).map((f) => make(f.id));
      const missed = period.kind === "week" && period.index % 9 === 4;
      return open || missed ? theirs : [...theirs, make(ME)];
    }),
  );
}
