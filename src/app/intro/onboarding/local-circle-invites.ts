import type { CircleInvites } from "./start-circle-client";

/** The circle an invite link carries (TODO(server): issue #26's invites will hold this on the server instead). */
export type InvitePayload = { id: string; name: string; colorId: string; from?: string };

const toBase64Url = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** TODO(server): a fake. The link opens the app with the circle in it, so it works without a server, in any browser. */
export function localCircleInvites(origin: string): CircleInvites {
  return {
    create: async (c) => {
      const payload: InvitePayload = { id: c.id, name: c.name, colorId: c.colorId, ...(c.from ? { from: c.from } : {}) };
      return { link: `${origin}/intro?invite=${toBase64Url(JSON.stringify(payload))}` };
    },
  };
}
