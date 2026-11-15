// TODO(re-evaluate when groups come from the database): swap this file for real group data.
// Every placeholder on the home screen lives here (docs/specs/home.md, HOME-1).

import type { CircleGroup, Palette } from "@/components/home/types";

const red: Palette = { canopy: "#C8432B", shade: "#93281A", highlight: "#F3A088", rim: "#FFD2C4" };
const green: Palette = { canopy: "#5E8068", shade: "#3F5F4C", highlight: "#B8D2BE", rim: "#D6F0DC" };
const amber: Palette = { canopy: "#E3A22F", shade: "#B97814", highlight: "#FBE2A0", rim: "#FFF0BE" };
const purple: Palette = { canopy: "#9A4FB0", shade: "#6B2F80", highlight: "#D7AEE3", rim: "#F0DDF6" };
const orange: Palette = { canopy: "#E8792E", shade: "#A8501A", highlight: "#F7B98A", rim: "#FFE3CC" };

// Captions break onto two lines at "\n", as in the reference card.
export const placeholderGroups: readonly CircleGroup[] = [
  {
    id: "uni-mates",
    name: "Uni Mates",
    palette: purple,
    friendCount: 2,
    memories: [
      { id: "uni-1", art: "city", caption: "library,\n2am" },
      { id: "uni-2", art: "churro", caption: "finals week\nfuel" },
      { id: "uni-3", art: "faces", caption: "grad day,\nfinally" },
    ],
    lastMemory: "last memory 3 weeks ago",
  },
  {
    id: "apt-4b",
    name: "Apt 4B",
    palette: green,
    friendCount: 3,
    memories: [
      { id: "apt-1", art: "people", caption: "the couch\nmove" },
      { id: "apt-2", art: "cookie", caption: "burnt\npancakes" },
      { id: "apt-3", art: "sunset", caption: "move-in\nday" },
    ],
    lastMemory: "last memory 5 days ago",
  },
  {
    id: "madrid-crew",
    name: "Madrid Crew",
    palette: red,
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
    friendCount: 5,
    memories: [
      { id: "hoops-1", art: "basketball", caption: "buzzer\nbeater" },
      { id: "hoops-2", art: "sunset", caption: "the 6am\nrun" },
      { id: "hoops-3", art: "people", caption: "post-game\ntacos" },
    ],
    lastMemory: "last memory yesterday",
  },
  {
    id: "work-mates",
    name: "Work Mates",
    palette: orange,
    friendCount: 5,
    memories: [
      { id: "work-1", art: "people", caption: "offsite\nkaraoke" },
      { id: "work-2", art: "cookie", caption: "bake-off,\nlost" },
      { id: "work-3", art: "faces", caption: "the great\ndesk swap" },
    ],
    lastMemory: "last memory 1 week ago",
  },
];

export const INITIAL_CENTER_ID = "madrid-crew";
