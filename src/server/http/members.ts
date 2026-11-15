import { removeGroupMember } from "../members";
import { handle, HttpError, json, type Deps } from "./kit";

// Clerk user ids are short opaque strings; the cap only keeps absurd input out of the query.
const MAX_USER_ID_LENGTH = 255;

/**
 * DELETE /api/groups/[id]/members/[userId] (API-22). Covers both "leave" (target is the caller) and "remove" (owner
 * only); the data layer decides which is allowed and answers everything else with the same NotFoundError.
 */
export function removeMemberHandler(req: Request, groupId: string, targetUserId: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => {
    if (targetUserId.length < 1 || targetUserId.length > MAX_USER_ID_LENGTH) {
      throw new HttpError(400, "invalid_request", ["userId"]);
    }
    await removeGroupMember(db, userId, groupId, targetUserId);
    return json({ removed: true });
  });
}
