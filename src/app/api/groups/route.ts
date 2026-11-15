import { createGroupHandler, listGroupsHandler } from "../../../server/http/groups";
import { deps } from "../deps";

export const POST = (req: Request) => createGroupHandler(req, deps());
export const GET = (req: Request) => listGroupsHandler(req, deps());
