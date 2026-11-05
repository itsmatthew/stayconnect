import type { z } from "zod";
import type { Db } from "../db";
import { NoRecipientsError, NotFoundError } from "../errors";

/** What a handler needs from the outside world. Wiring (`src/app/api`) supplies the real ones, tests supply fakes. */
export interface Deps {
  db: Db;
  /** The verified session user, or null when signed out. Never read from the request. */
  getUserId: () => Promise<string | null>;
}

export interface Ctx {
  req: Request;
  db: Db;
  userId: string;
}

/** Thrown inside a handler to answer with a known status. The body carries a code, never user input. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fields?: string[],
  ) {
    super(code);
  }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Wraps every endpoint with the shared rules, in order: session (API-1), origin (API-2), content type (API-3),
 * then the handler. Known errors map to statuses (API-5); anything else is a generic 500 (API-6).
 */
export async function handle(req: Request, deps: Deps, run: (ctx: Ctx) => Promise<Response>): Promise<Response> {
  try {
    const userId = await deps.getUserId().catch(() => null);
    if (!userId) throw new HttpError(401, "unauthorized");

    if (MUTATING.has(req.method)) {
      const origin = req.headers.get("origin");
      if (origin !== null && !sameHost(origin, req.url)) throw new HttpError(403, "forbidden");
    }
    if (req.body !== null && !isJson(req.headers.get("content-type"))) throw new HttpError(415, "unsupported_media_type");

    return await run({ req, db: deps.db, userId });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Reads and validates a JSON body (API-4). Failures name the fields, never the submitted values. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid_request", ["body"]);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((i) => i.path.join(".") || "body"))];
    throw new HttpError(400, "invalid_request", fields);
  }
  return result.data;
}

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json(err.fields ? { error: err.code, fields: err.fields } : { error: err.code }, err.status);
  }
  if (err instanceof NotFoundError) return json({ error: "not_found" }, 404);
  if (err instanceof NoRecipientsError) return json({ error: "no_recipients" }, 409);
  // Name and message only: the request body and headers may hold a caption or a token.
  const e = err instanceof Error ? err : new Error(String(err));
  console.error(`api error: ${e.name}: ${e.message}`);
  return json({ error: "internal" }, 500);
}

function isJson(contentType: string | null): boolean {
  return contentType !== null && contentType.split(";")[0].trim().toLowerCase() === "application/json";
}

// TODO(re-evaluate when this is first deployed to a Vercel preview): confirm the browser's Origin host equals the host in req.url;
// if they differ, compare against the x-forwarded-host header instead. A mismatch fails closed (403), so it shows up at once.
function sameHost(origin: string, requestUrl: string): boolean {
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}
