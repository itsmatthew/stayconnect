import { joinWithInvite, previewInvite } from "../invites";
import { handle, json, type Deps } from "./kit";

// The token is the last URL segment, so it shows up in hosting request logs (API-21). Don't log it or echo it back.

/** GET /api/invites/[token] (API-19) */
export function inviteInfoHandler(req: Request, token: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => json(await previewInvite(db, userId, token)));
}

/** POST /api/invites/[token]/join (API-20). Needs no body. */
export function joinInviteHandler(req: Request, token: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => json(await joinWithInvite(db, userId, token)));
}
