// TODO(re-evaluate when groups come from the database): swap this file for real data.
// Every placeholder in the app lives here: groups (docs/specs/home.md, HOME-1), friends,
// seed conversations and the replies "simulate reply" uses (docs/specs/messages.md).

import type { CircleGroup, Friend, Palette } from "@/components/home/types";
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
];

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
    members: ["mom", "dad"],
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
    chat("friend:leo", null, [["leo", 1 * HOUR, "send me that pic from the rooftop"]]),
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
