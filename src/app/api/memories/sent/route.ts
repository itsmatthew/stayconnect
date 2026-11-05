import { sentHandler } from "../../../../server/http/memories";
import { deps } from "../../deps";

export const GET = (req: Request) => sentHandler(req, deps());
