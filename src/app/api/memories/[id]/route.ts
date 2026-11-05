import { getMemoryHandler } from "../../../../server/http/memories";
import { deps } from "../../deps";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getMemoryHandler(req, id, deps());
}
