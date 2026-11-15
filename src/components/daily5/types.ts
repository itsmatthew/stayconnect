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
};

/** The send picker's sections, in order. Party ids are conversation ids. */
export type RecipientSections = { closest: readonly Party[]; others: readonly Party[]; people: readonly Party[] };
