import { z } from "zod";
import { MAX_EXPIRES_IN_DAYS, MAX_USES_PER_INVITE } from "../invites";

/** BE-15: 1 to 80 characters after trimming. Extra fields are dropped. */
export const createGroupBody = z.object({ name: z.string().trim().min(1).max(80) });

/** BE-15. Length is counted in characters, like the database check, so an emoji counts as one (not two UTF-16 units). */
export const sendMemoryBody = z.object({
  groupId: z.guid(),
  caption: z.string().refine((s) => [...s].length <= 500),
});

/** INV-3. Both fields optional (defaults are applied by the data layer); extra fields are dropped. */
export const createInviteBody = z.object({
  expiresInDays: z.number().int().min(1).max(MAX_EXPIRES_IN_DAYS).optional(),
  maxUses: z.number().int().min(1).max(MAX_USES_PER_INVITE).optional(),
});
