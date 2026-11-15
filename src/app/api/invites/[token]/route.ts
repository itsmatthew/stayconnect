import { inviteInfoHandler } from "../../../../server/http/join";
import { deps } from "../../deps";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return inviteInfoHandler(req, token, deps());
}
