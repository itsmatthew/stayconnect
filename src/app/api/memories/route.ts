import { sendMemoryHandler } from "../../../server/http/memories";
import { deps } from "../deps";

export const POST = (req: Request) => sendMemoryHandler(req, deps());
