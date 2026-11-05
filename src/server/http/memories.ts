import { getMemory, listInbox, sendMemory, type Memory } from "../memories";
import { handle, json, parseBody, type Deps } from "./kit";
import { sendMemoryBody } from "./schemas";

/** The fields we return. Explicit on purpose: `photoKey` is a storage detail and stays server-side. */
const view = (m: Memory) => ({
  id: m.id,
  groupId: m.groupId,
  senderId: m.senderId,
  caption: m.caption,
  createdAt: m.createdAt,
});

/** POST /api/memories (API-10) */
export function sendMemoryHandler(req: Request, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ req, db, userId }) => {
    const { groupId, caption } = await parseBody(req, sendMemoryBody);
    return json(await sendMemory(db, userId, { groupId, caption }), 201);
  });
}

/** GET /api/memories/inbox (API-11) */
export function inboxHandler(req: Request, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => {
    const memories = await listInbox(db, userId);
    return json({ memories: memories.map((m) => ({ ...view(m), replied: m.replied })) });
  });
}

/** GET /api/memories/[id] (API-12). The id comes from the URL; the data layer treats a malformed one as not found. */
export function getMemoryHandler(req: Request, id: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => json(view(await getMemory(db, userId, id))));
}
