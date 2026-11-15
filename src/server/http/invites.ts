import { createInvite, listInvites, revokeInvite } from "../invites";
import { handle, json, parseBody, type Deps } from "./kit";
import { createInviteBody } from "./schemas";

// Owner-only invite management. The group id and invite id come from the URL and are checked by the data layer, which
// answers a non-owner, an unknown id, and a malformed id with the same NotFoundError.

/** POST /api/groups/[id]/invites (API-16). No body means all defaults. The token is in this response and nowhere else. */
export function createInviteHandler(req: Request, groupId: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ req, db, userId }) => {
    const options = req.body === null ? {} : await parseBody(req, createInviteBody);
    const invite = await createInvite(db, userId, groupId, options);
    return json({ id: invite.id, token: invite.token, expiresAt: invite.expiresAt, maxUses: invite.maxUses }, 201);
  });
}

/** GET /api/groups/[id]/invites (API-17) */
export function listInvitesHandler(req: Request, groupId: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => json({ invites: await listInvites(db, userId, groupId) }));
}

/** DELETE /api/groups/[id]/invites/[inviteId] (API-18) */
export function revokeInviteHandler(req: Request, groupId: string, inviteId: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => {
    await revokeInvite(db, userId, groupId, inviteId);
    return json({ revoked: true });
  });
}
