import { revokeInviteHandler } from "../../../../../../server/http/invites";
import { deps } from "../../../../deps";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; inviteId: string }> }) {
  const { id, inviteId } = await params;
  return revokeInviteHandler(req, id, inviteId, deps());
}
