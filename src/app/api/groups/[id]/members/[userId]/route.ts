import { removeMemberHandler } from "../../../../../../server/http/members";
import { deps } from "../../../../deps";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  return removeMemberHandler(req, id, userId, deps());
}
