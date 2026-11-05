import { inboxHandler } from "../../../../server/http/memories";
import { deps } from "../../deps";

export const GET = (req: Request) => inboxHandler(req, deps());
