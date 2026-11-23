import type { Party } from "../home/types";

export type PoolId = "mine" | "family";

export type Daily5Card = { id: string; src: string; alt: string; dateLabel: string };

export type PoolView = {
  id: PoolId;
  label: string;
  count: number;
  /** Files handled so far in the running import. */
  progress?: { done: number; total: number };
  /** Files the browser couldn't decode, from the last import. */
  skipped: number;
  /** A line under the name saying what goes in it. */
  hint?: string;
  /** The remembered folder's name (D5-14), and why it couldn't be checked. */
  folder?: string;
  folderError?: string;
};

/** Where the browser can keep a folder (D5-14): choose, check again and forget are buttons, not the plain picker. */
export type FolderActions = { onChoose: (pool: PoolId) => void; onCheck: (pool: PoolId) => void; onForget: (pool: PoolId) => void };

/** The send picker's sections, in order. Party ids are conversation ids. */
export type RecipientSections = { closest: readonly Party[]; others: readonly Party[]; people: readonly Party[] };
