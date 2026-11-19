import type { CircleInvites } from "./start-circle-client";

import { encodeInvite } from "./invite";

/** TODO(server): a fake. The link opens the app with the circle in it, so it works without a server, in any browser. */
export function localCircleInvites(origin: string): CircleInvites {
  return {
    create: async (c) => ({ link: `${origin}/intro?invite=${encodeInvite(c)}` }),
  };
}
