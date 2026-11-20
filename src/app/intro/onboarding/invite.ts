// The invite link (docs/specs/onboarding.md, ONB-19 to ONB-20). Plain TypeScript: no React, for the mobile app too.
// TODO(server): issue #26's invites will live on the server; until then the link carries the circle itself.

import { isColorId } from "../colors/palette";
import type { MyCircle } from "./my-circles";

/** The circle an invite link carries. */
export type InvitePayload = { id: string; name: string; colorId: string; from?: string };

export function encodeInvite(p: InvitePayload): string {
  const json = JSON.stringify({ id: p.id, name: p.name, colorId: p.colorId, ...(p.from ? { from: p.from } : {}) });
  return btoa(String.fromCharCode(...new TextEncoder().encode(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** What a link's `invite=` carries, or null for anything that isn't a readable invite. */
export function readInvite(token: string): InvitePayload | null {
  try {
    const bytes = Uint8Array.from(atob(token.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const v: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const { id, name, colorId, from } = v as Record<string, unknown>;
    if (typeof id !== "string" || !id || typeof name !== "string" || !name.trim() || typeof colorId !== "string" || !isColorId(colorId)) return null;
    return { id, name, colorId, ...(typeof from === "string" && from.trim() ? { from } : {}) };
  } catch {
    return null;
  }
}

/** The circle you join from an invite: yours from now on, saved with the ones you started. */
export const joinedCircle = (p: InvitePayload, now: number): MyCircle => ({ id: p.id, name: p.name, colorId: p.colorId, createdAt: now, ...(p.from ? { from: p.from } : {}), joined: true });
