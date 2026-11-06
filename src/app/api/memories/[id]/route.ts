import { deleteMemoryHandler, getMemoryHandler } from "../../../../server/http/memories";
import { deps } from "../../deps";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return getMemoryHandler(req, id, deps());
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return deleteMemoryHandler(req, id, deps());
}
