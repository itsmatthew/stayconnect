// Small, made-up circles for the Archive tests, independent of the app's placeholder data.
import { emptyData, type AppData } from "@/app/intro/app-data";
import { periodFromKey } from "@/app/intro/archive/periods";
import type { ArchivePost } from "@/app/intro/archive/posts";
import { ME } from "@/app/intro/messages/conversations";
import type { CircleGroup, Friend, Memory } from "@/components/home/types";

const pal = (canopy: string) => ({ canopy, shade: canopy, highlight: canopy, rim: canopy });
const mem: Memory = { id: "m", art: "sunset", caption: "a\nb" };
const group = (id: string, name: string, canopy: string, closest: boolean, members: string[], viewers?: string[]): CircleGroup => ({
  id,
  name,
  palette: pal(canopy),
  closest,
  members,
  viewers,
  friendCount: members.length,
  memories: [mem, mem, mem],
  lastMemory: "last memory today",
});

export const RED = "#C8432B";
export const GOLD = "#E3A22F";
export const GREEN = "#5E8068";
export const BLUE = "#3F86C4";

// Deliberately not closest-first, to check the ordering.
export const groups: CircleGroup[] = [
  group("greens", "Greens", GREEN, false, ["leo"]),
  group("reds", "Reds", RED, true, ["leo", "ana", "sam"]),
  group("golds", "Golds", GOLD, true, ["leo", "sam"]),
  group("blues", "Blues", BLUE, false, ["leo", "gran", "kim"], ["gran"]),
];

const look = { skin: "#EDB98F", hair: "#6B3F23", shirt: "#2B3350", bg: "#CFE0F4", ring: "#3F9AD8" };
export const friends: Friend[] = ["leo", "ana", "sam", "gran", "kim", "zed"].map((id) => ({
  id,
  name: id[0].toUpperCase() + id.slice(1),
  closest: id === "leo",
  look,
}));

let n = 0;
export function post(author: string, period: string, extra: Partial<ArchivePost> = {}): ArchivePost {
  const p = periodFromKey(period);
  return {
    id: `post-${++n}`,
    author,
    period,
    postedAt: p.start + 3_600_000,
    takenAt: p.start + 1_800_000,
    photo: { kind: "art", art: "sunset" },
    ...extra,
  };
}
export const mine = (period: string) => post(ME, period);

export function fixtureData(posts: ArchivePost[], extra: Partial<AppData> = {}): AppData {
  return { ...emptyData, groups, friends, posts: () => posts, ...extra };
}

export const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
