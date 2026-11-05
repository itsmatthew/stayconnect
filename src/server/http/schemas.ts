import { z } from "zod";

/** BE-15: 1 to 80 characters after trimming. Extra fields are dropped. */
export const createGroupBody = z.object({ name: z.string().trim().min(1).max(80) });

/** BE-15. Length is counted in characters, like the database check, so an emoji counts as one (not two UTF-16 units). */
export const sendMemoryBody = z.object({
  groupId: z.guid(),
  caption: z.string().refine((s) => [...s].length <= 500),
});
