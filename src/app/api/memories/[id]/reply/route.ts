import { replyHandler } from "../../../../../server/http/memories";
import { deps } from "../../../deps";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return replyHandler(req, id, deps());
}
