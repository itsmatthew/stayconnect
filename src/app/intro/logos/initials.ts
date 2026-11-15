// A group's default logo (docs/specs/group-logo.md, LOGO-1): its initials, at most 3 characters.

const MAX = 3;

/** First letters, numbers kept whole ("Fall 24" → F24), ’14-style years skipped, words that don't fit skipped rather than cut. */
export function logoInitials(name: string): string {
  let out = "";
  for (const word of name.trim().split(/\s+/)) {
    if (!word || /^[’'‘]/.test(word)) continue;
    const part = /\d/.test(word) ? word : word[0];
    if (out.length + part.length <= MAX) out += part;
  }
  return (out || (name.match(/[\p{L}\p{N}]/u)?.[0] ?? "")).toUpperCase();
}
