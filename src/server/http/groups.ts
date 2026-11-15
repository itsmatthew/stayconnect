import { createGroup, listGroups } from "../groups";
import { handle, json, parseBody, type Deps } from "./kit";
import { createGroupBody } from "./schemas";

/** POST /api/groups (API-8) */
export function createGroupHandler(req: Request, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ req, db, userId }) => {
    const { name } = await parseBody(req, createGroupBody);
    return json(await createGroup(db, userId, name), 201);
  });
}

/** GET /api/groups (API-9) */
export function listGroupsHandler(req: Request, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => json({ groups: await listGroups(db, userId) }));
}
