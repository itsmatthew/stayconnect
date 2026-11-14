/**
 * Thrown for both "does not exist" and "exists but you may not see it", so a caller can't probe for ids
 * (docs/specs/memories-backend.md BE-2, BE-9). The HTTP layer maps this to 404.
 */
export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}

/** The group has no one else to send to (BE-4). The HTTP layer maps this to 409. */
export class NoRecipientsError extends Error {
  constructor() {
    super("The group has no other members");
    this.name = "NoRecipientsError";
  }
}

/** The group is at its member limit (INV-10). The HTTP layer maps this to 409. */
export class GroupFullError extends Error {
  constructor() {
    super("The group is full");
    this.name = "GroupFullError";
  }
}

/** Too many failed invite lookups recently (INV-11). The HTTP layer maps this to 429. */
export class RateLimitedError extends Error {
  constructor() {
    super("Too many attempts");
    this.name = "RateLimitedError";
  }
}
