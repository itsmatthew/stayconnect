import type { PhotoView } from "../archive/types";

/** One of the year's 65 (or 66) slots (docs/specs/me.md, ME-2/3). */
export type MeTile = { key: string; size: "year" | "month" | "week" | "bonus"; title: string; photo?: PhotoView; caption?: string };
