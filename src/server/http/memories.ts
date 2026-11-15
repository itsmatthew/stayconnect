import { deleteMemory, getMemory, listInbox, listSent, replyToMemory, sendMemory, type Memory } from "../memories";
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

/** POST /api/memories/[id]/reply (API-13). Idempotent; no body needed. */
export function replyHandler(req: Request, id: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => {
    await replyToMemory(db, userId, id);
    return json({ replied: true });
  });
}

/** GET /api/memories/sent (API-14). Unreplied memories are absent: the data layer never returns them. */
export function sentHandler(req: Request, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => {
    const memories = await listSent(db, userId);
    return json({ memories: memories.map((m) => ({ ...view(m), replies: m.replies })) });
  });
}

/** DELETE /api/memories/[id] (API-15). Sender only; anyone else gets the same 404 as a missing id. */
export function deleteMemoryHandler(req: Request, id: string, deps: Deps): Promise<Response> {
  return handle(req, deps, async ({ db, userId }) => {
    await deleteMemory(db, userId, id);
    return json({ deleted: true });
  });
}
