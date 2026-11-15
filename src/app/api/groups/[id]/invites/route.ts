import { createInviteHandler, listInvitesHandler } from "../../../../../server/http/invites";
import { deps } from "../../../deps";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return createInviteHandler(req, id, deps());
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return listInvitesHandler(req, id, deps());
}
