// The order of search results in the drop sheet (docs/specs/mail.md, MAIL-12). Plain TypeScript.

export type Candidate = { name: string; inCircle: boolean; mutualCount: number; /** You typed their whole @username. */ exactUsername?: boolean };

/** 0: the first name starts with it; 1: a later name does; 2: it's anywhere in the name; undefined: no match. */
export function nameMatch(name: string, text: string): 0 | 1 | 2 | undefined {
  const lower = name.toLowerCase();
  const words = lower.split(/\s+/);
  if (words[0].startsWith(text)) return 0;
  if (words.slice(1).some((w) => w.startsWith(text))) return 1;
  return lower.includes(text) ? 2 : undefined;
}

/**
 * Exact @username first, then your circle, then most mutual friends, then the best name match (a match by username
 * only comes last), then A to Z, so the list never jumps around.
 */
export function rankCandidates<T extends Candidate>(list: readonly T[], text: string): T[] {
  const key = (c: T) => [c.exactUsername ? 0 : 1, c.inCircle ? 0 : 1, -c.mutualCount, nameMatch(c.name, text) ?? 3] as const;
  return [...list].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return a.name.localeCompare(b.name);
  });
}
