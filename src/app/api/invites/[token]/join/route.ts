import { joinInviteHandler } from "../../../../../server/http/join";
import { deps } from "../../../deps";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return joinInviteHandler(req, token, deps());
}
