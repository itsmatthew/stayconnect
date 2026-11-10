// TODO(re-evaluate when groups come from the database): swap this file for real data.
// Every placeholder in the app lives here: groups (docs/specs/home.md, HOME-1), friends,
// their rings and gifts in Your circle (docs/specs/circle.md), seed conversations, the replies "simulate reply" uses (docs/specs/messages.md), Archive posts
// (docs/specs/archive.md), and next-time-together goals and up-to rows (docs/specs/group-profile.md). Only app-data.ts imports it, behind the demo switch (docs/specs/demo.md).

import type { ArtKind, CircleGroup, Friend } from "@/components/home/types";
import type { UpToRow } from "@/components/profile/types";
import type { ReceivedGift } from "./circle/gifts";
import type { Placements } from "./circle/rings";
import { isOpen, isoWeek, periodsOfYear } from "./archive/periods";
import type { ArchivePost } from "./archive/posts";
import { groupPalette } from "./colors/palette";
import type { DirectoryEntry } from "./mail/directory";
import type { InboxState, Letter, MailSender } from "./mail/inbox";
import { ME, type ChatMessage, type Conversation } from "./messages/conversations";
import { localDay, type GoalState } from "./profile/goals";

/** A demo group's shared color, and when the user joined it. Two groups share red, to show the shade shift (COLOR-5). */
const colored = (colorId: string, year: number) => ({ colorId, palette: groupPalette(colorId, 0), joinedAt: new Date(year, 0, 1).getTime() });

/** What each friend's other groups use, for `suggestGroupColor` (COLOR-4). */
export const placeholderMemberColors: Readonly<Record<string, readonly string[]>> = {
  leo: ["red", "green"],
  ana: ["red", "blue"],
  nico: ["amber"],
  sam: ["amber", "purple"],
  jordan: ["green", "orange"],
  priya: ["teal"],
};

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
    ...colored("red", 2019),
    closest: true,
    members: ["leo", "ana", "nico"],
    friendCount: 6,
    memories: [
      { id: "madrid-1", caption: "" },
      { id: "madrid-2", caption: "" },
      { id: "madrid-3", caption: "" },
    ],
    lastMemory: "last memory 2 days ago",
    // Header photos (GP-12), drawn as art with their capture dates.
    firstPhoto: { art: "faces", takenAt: new Date(2014, 5, 14).getTime() },
    lastPhoto: { art: "city", takenAt: new Date(2026, 7, 9).getTime() },
  },
  {
    id: "hoops-since-14",
    name: "Hoops Since ’14",
    ...colored("amber", 2014),
    closest: true,
    members: ["sam", "jordan", "leo"],
    friendCount: 5,
    memories: [
      { id: "hoops-1", caption: "" },
      { id: "hoops-2", caption: "" },
      { id: "hoops-3", caption: "" },
    ],
    lastMemory: "last memory yesterday",
    // Header photos (GP-12), drawn as art with their capture dates.
    firstPhoto: { art: "basketball", takenAt: new Date(2014, 2, 3).getTime() },
    lastPhoto: { art: "people", takenAt: new Date(2026, 8, 27).getTime() },
  },
  {
    id: "apt-4b",
    name: "Apt 4B",
    ...colored("green", 2021),
    closest: true,
    members: ["priya", "ana"],
    friendCount: 3,
    memories: [
      { id: "apt-1", caption: "" },
      { id: "apt-2", caption: "" },
      { id: "apt-3", caption: "" },
    ],
    lastMemory: "last memory 5 days ago",
    // Header photos (GP-12), drawn as art with their capture dates.
    firstPhoto: { art: "cookie", takenAt: new Date(2019, 8, 1).getTime() },
    lastPhoto: { art: "sunset", takenAt: new Date(2026, 4, 30).getTime() },
  },
  {
    id: "family",
    name: "Family",
    ...colored("blue", 2012),
    closest: true,
    members: ["mom", "dad", "grandma"],
    // Grandma sees everyone's Archive posts without posting (ARC-5).
    viewers: ["grandma"],
    friendCount: 4,
    memories: [
      { id: "family-1", caption: "" },
      { id: "family-2", caption: "" },
      { id: "family-3", caption: "" },
    ],
    lastMemory: "last memory 4 days ago",
    // Header photos (GP-12), drawn as art with their capture dates.
    firstPhoto: { art: "people", takenAt: new Date(1998, 11, 25).getTime() },
    lastPhoto: { art: "cookie", takenAt: new Date(2025, 11, 25).getTime() },
  },
  {
    id: "uni-mates",
    name: "Uni Mates",
    ...colored("purple", 2020),
    closest: false,
    members: ["priya", "jordan"],
    friendCount: 2,
    memories: [
      { id: "uni-1", caption: "" },
      { id: "uni-2", caption: "" },
      { id: "uni-3", caption: "" },
    ],
    lastMemory: "last memory 3 weeks ago",
    // Header photos (GP-12), drawn as art with their capture dates.
    firstPhoto: { art: "city", takenAt: new Date(2015, 8, 20).getTime() },
    lastPhoto: { art: "faces", takenAt: new Date(2025, 5, 12).getTime() },
  },
  {
    id: "work-mates",
    name: "Work Mates",
    ...colored("orange", 2023),
    closest: false,
    members: ["sam", "nico"],
    friendCount: 5,
    memories: [
      { id: "work-1", caption: "" },
      { id: "work-2", caption: "" },
      { id: "work-3", caption: "" },
    ],
    lastMemory: "last memory 1 week ago",
    // Header photos (GP-12), drawn as art with their capture dates.
    firstPhoto: { art: "sunset", takenAt: new Date(2022, 0, 10).getTime() },
    lastPhoto: { art: "churro", takenAt: new Date(2026, 2, 6).getTime() },
  },
  {
    id: "fall-24",
    name: "Fall 24",
    ...colored("red", 2024),
    closest: false,
    members: ["jordan", "ana", "nico"],
    friendCount: 3,
    memories: [
      { id: "fall-1", caption: "" },
      { id: "fall-2", caption: "" },
      { id: "fall-3", caption: "" },
    ],
    lastMemory: "last memory 2 weeks ago",
    // No header photos (GP-12), so the empty state shows in development.
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
  const madrid = chat("group:madrid-crew", 20 * HOUR, [
    ["leo", 26 * HOUR, "rooftop again friday?"],
    ["ana", 25.5 * HOUR, "only if we skip the 4am churros"],
    [ME, 25 * HOUR, "we are not skipping the churros"],
  ]);
  return [
    { ...madrid, messages: [...madridMemories(now), ...madrid.messages] },
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

/**
 * Memories already shared in Madrid Crew, drawn as art (there are no stored demo photos): the profile's recent photos (GP-5),
 * and one taken this same ISO week three years ago, so the "then" tile shows (GP-6).
 */
function madridMemories(now: number): ChatMessage[] {
  const memory = (i: number, from: string, ago: number, art: ArtKind, takenAt: number): ChatMessage => ({
    id: `group:madrid-crew/memory-${i}`,
    kind: "memory",
    from,
    at: now - ago,
    photoId: `demo:madrid-${i}`,
    art,
    takenAt,
    note: "",
  });
  return [
    memory(0, "leo", 40 * DAY, "city", sameWeekYearsAgo(now, 3)),
    memory(1, "ana", 30 * DAY, "churro", new Date(2023, 3, 14).getTime()),
    memory(2, "nico", 20 * DAY, "faces", new Date(2022, 7, 2).getTime()),
    memory(3, "leo", 9 * DAY, "sunset", new Date(2024, 5, 21).getTime()),
    memory(4, "ana", 3 * DAY, "people", new Date(2021, 9, 9).getTime()),
  ];
}

/** Noon on the same weekday of the same ISO week, `years` ISO years back. */
function sameWeekYearsAgo(now: number, years: number): number {
  const { year, week } = isoWeek(now);
  let t = now - years * 364 * DAY;
  // 364-day steps keep the weekday but can drift a week across a 53-week year.
  while (isoWeek(t).year * 100 + isoWeek(t).week < (year - years) * 100 + week) t += 7 * DAY;
  while (isoWeek(t).year * 100 + isoWeek(t).week > (year - years) * 100 + week) t -= 7 * DAY;
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
}

/** Madrid Crew's next time together: a lake weekend 46 days out, everyone in (GP-11). */
export function placeholderGoals(now: number): GoalState {
  return { "madrid-crew": { label: "lake weekend", date: localDay(now + 46 * DAY), setBy: "leo", in: ["leo", "ana", "nico", ME] } };
}

/** "What everyone’s up to", visual only (GP-10). */
export const placeholderUpTo: Readonly<Record<string, readonly UpToRow[]>> = {
  "madrid-crew": [
    { when: "Nov 3–5", text: "Leo is in Lisbon for work" },
    { when: "Nov 14", text: "Ana turns 30" },
    { when: "Nov 16", text: "Nico starts his new job" },
  ],
};

/** Two gifts under Your circle's tree (CIRCLE-12), timed back from `now`. */
export function placeholderGifts(now: number): ReceivedGift[] {
  return [
    { id: "placeholder-gift/mom", from: "mom", receivedAt: now - 1 * DAY },
    { id: "placeholder-gift/leo", from: "leo", receivedAt: now - 2 * HOUR },
  ];
}

/**
 * People on Now & Then outside the demo user's circle, for dropping photos (docs/specs/mail.md, MAIL-3).
 * Theo has turned off "Let people find me by name", so only his username or number finds him.
 */
export const placeholderDirectory: readonly DirectoryEntry[] = [
  { id: "kate-morgan", name: "Kate Morgan", username: "katemorgan", phone: "+15550123456", findableByName: true, mutual: ["Leo", "Ana"], look: { skin: "#F1C7A0", hair: "#B8562E", shirt: "#7A4E8C", bg: "#E6D3F0", ring: "#7A4E8C" } },
  { id: "katie-ruiz", name: "Katie Ruiz", username: "katieruiz", phone: "+15550198765", findableByName: true, mutual: ["Sam"], mailbox: "friendsOfFriends", look: { skin: "#C98A5C", hair: "#2A1C14", shirt: "#4F8F8B", bg: "#CFE0D4", ring: "#4F8F8B" } },
  { id: "kate-bishop", name: "Kate Bishop", username: "katebishop", phone: "+15550133344", findableByName: true, mutual: ["Leo", "Ana", "Sam", "Priya"], look: { skin: "#E8B48C", hair: "#3B2A1E", shirt: "#B43A2A", bg: "#F6D9A8", ring: "#B43A2A" } },
  { id: "kate-sullivan", name: "Kate Sullivan", username: "katesullivan", phone: "+15550144455", findableByName: true, mutual: [], look: { skin: "#F3D2B5", hair: "#D9A441", shirt: "#3F9AD8", bg: "#CFE0F4", ring: "#3F9AD8" } },
  { id: "theo-park", name: "Theo Park", username: "theopark", phone: "+15550111222", findableByName: false, mutual: [], mailbox: "circles", look: { skin: "#F1C7A0", hair: "#8C8C8C", shirt: "#2B3350", bg: "#F6D9A8", ring: "#2B3350" } },
];

/** How the demo user signs a gift's postcard (docs/specs/gifts.md, GIFT-7). */
export const placeholderSenderName = "Jackson";

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

/**
 * Your mailbox (docs/specs/mailbox.md): three new photos from Kate Morgan, who isn't in your circle, stacked in one
 * envelope; one from Leo; and some kept from before. Photos are drawn, never real.
 */
export function placeholderMail(now: number): InboxState {
  const DAY = 86_400_000;
  const friend = (id: string): MailSender => {
    const f = friends.find((x) => x.id === id)!;
    return { id: f.id, name: f.name, look: f.look, inCircle: true };
  };
  const kate = placeholderDirectory[0];
  const stranger: MailSender = { id: kate.id, name: kate.name, look: kate.look, inCircle: false };
  const l = (id: string, from: MailSender, art: string, sentAgo: number, takenYear: number, status: Letter["status"]): Letter => ({
    id,
    from,
    photo: { kind: "art", art },
    takenAt: new Date(takenYear, 10, 4).getTime(),
    sentAt: now - sentAgo,
    status,
  });
  return {
    letters: [
      l("demo-mail-1", friend("leo"), "basketball", DAY, 2019, "new"),
      l("demo-mail-2", stranger, "faces", 3 * 3_600_000, 2014, "new"),
      l("demo-mail-3", stranger, "sunset", 2 * 3_600_000, 2016, "new"),
      l("demo-mail-4", stranger, "people", 3_600_000, 2017, "new"),
      l("demo-mail-5", friend("priya"), "cookie", 2 * DAY, 2021, "kept"),
      l("demo-mail-6", friend("leo"), "city", 20 * DAY, 2023, "kept"),
      l("demo-mail-7", friend("ana"), "churro", 38 * DAY, 2024, "kept"),
    ],
    blocked: [],
    reports: [],
  };
}
